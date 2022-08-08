using {SFBTPExtention.db as db} from '../db/data-model';

using { RCMCandidate } from './external/RCMCandidate.csn';

service CatalogService @(path : '/catalog')
@(requires: 'authenticated-user')
{
    entity Sales
      @(restrict: [{ grant: ['READ'],
                     to: 'Viewer'
                   },
                   { grant: ['WRITE'],
                     to: 'Admin' 
                   }
                  ])
      as select * from db.Sales
      actions {
        @(restrict: [{ to: 'Admin' }])
        action boost() returns Sales;
      }
    ;





    @readonly
    entity Candidates
      @(restrict: [{ to: 'Viewer' }])
      as projection on RCMCandidate.Candidate {
          candidateId,
          firstName,
          lastName,
          cellPhone,
          city,
          zip,
          country
        };

    entity CandidatesLog
      @(restrict: [{ to: 'Viewer' }])
      as select * from db.CandidatesLog
    ;



    type userScopes { identified: Boolean; authenticated: Boolean; Viewer: Boolean; Admin: Boolean; };
    type userType { user: String; locale: String; scopes: userScopes; };
    function userInfo() returns userType;


};