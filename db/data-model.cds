using { cuid, managed } from '@sap/cds/common';

namespace SFBTPExtention.db;

entity Sales {
  key ID          : Integer;
      region      : String(100);
      country     : String(100);
      org         : String(4);
      amount      : Integer;
      comments    : String(100);
      criticality : Integer;
};

entity CandidatesLog : cuid {
      candidateId : Integer;
      cellPhone   : String;
};


