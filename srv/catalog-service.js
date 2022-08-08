const cds = require('@sap/cds');
const debug = require('debug')('srv:catalog-service');

module.exports = cds.service.impl(async function () {

    const sfrcm = await cds.connect.to('RCMCandidate');
    const em = await cds.connect.to('messaging'); 
    const db = await cds.connect.to('db'); 

    const {
            Sales
            ,
            Candidates
            ,
            CandidatesLog
          } = this.entities;

    this.after('READ', Sales, (each) => {
        if (each.amount > 500) {
            each.criticality = 3;
            if (each.comments === null)
                each.comments = '';
            else
                each.comments += ' ';
            each.comments += 'Exceptional!';
            debug(each.comments, {"country": each.country, "amount": each.amount});
        } else if (each.amount < 150) {
            each.criticality = 1;
        } else {
            each.criticality = 2;
        }
    });

    this.on('boost', Sales, async req => {
        try {
            const ID = req.params[0];
            const tx = cds.tx(req);
            await tx.update(Sales)
                .with({ amount: { '+=': 250 }, comments: 'Boosted!' })
                .where({ ID: { '=': ID } })
                ;
            debug('Boosted ID:', ID);
            em.tx(req).emit('extention/btp/successfacor/SFBTPExtention/topic/boost', { "ID": ID });
            const cs = await cds.connect.to('CatalogService');
            let results = await cs.read(SELECT.from(Sales, ID));
            return results;
        } catch (err) {
            req.reject(err);
        }
    });

    em.on('extention/btp/successfacor/SFBTPExtention/topic/boost', async msg => {
        debug('Event Mesh: Boost:', msg.data);
        try {
            await db.tx(msg).run (
                UPDATE(Sales).with({ comments: 'Boosted! Mesh!' }).where({ ID: { '=': msg.data.ID } })
            );
        } catch (err) {
            console.error(err);
        }
    });



    em.on('extention/btp/successfacor/SFBTPExtention/candidate/updated', async msg => {
        debug('Event Mesh: Candidate Updated:', msg.headers);
        try {
            await db.tx(msg).run (
                INSERT.into(CandidatesLog).entries({ candidateId: msg.headers.candidateId, cellPhone: msg.headers.cellPhone })
            );
        } catch (err) {
            console.error(err);
        }
    });





    this.on('READ', Candidates, async (req) => {
        try {
            const tx = sfrcm.transaction(req);
            return await tx.send({
                query: req.query,
                headers: {
                    'Application-Interface-Key': process.env.ApplicationInterfaceKey,
                    'APIKey': process.env.APIKeyHubSandbox
                }
            })
        } catch (err) {
            req.reject(err);
        }
    });










    this.on('userInfo', req => {
        let results = {};
        results.user = req.user.id;
        if (req.user.hasOwnProperty('locale')) {
            results.locale = req.user.locale;
        }
        results.scopes = {};
        results.scopes.identified = req.user.is('identified-user');
        results.scopes.authenticated = req.user.is('authenticated-user');
        results.scopes.Viewer = req.user.is('Viewer');
        results.scopes.Admin = req.user.is('Admin');
        em.tx(req).emit('extention/btp/successfacor/SFBTPExtention/topic/user', results);
        return results;
    });

    em.on('extention/btp/successfacor/SFBTPExtention/topic/user', async msg => {
        debug('Event Mesh: User:', msg.data);
    });


});