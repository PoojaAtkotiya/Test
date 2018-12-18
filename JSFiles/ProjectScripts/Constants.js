var applicationName = "Item Code Creation Preprocess";
var formName = "Item Code Preprocess Form";
var globalApprovalMatrixName = 'ApprovalMatrix';
var approverMatrixListName = 'WorkflowTestApprovalMatrix';
var ItemCodeProProcessListName = "ItemCodeProProcess";
var ItemCodeApprovalMatrixListName = "ItemCodeApprovalMatrix";
var ApproverMasterListName = "ApproverMaster";
var buttonListName = 'Buttons';
var buttonActionStatus = {
    None: 1,
    SaveAsDraft: 2,
    Print: 7,
    NextApproval: 11,
    BackToCreator: 12,
    Complete: 15,
    SendBack: 23,
    Submit: 27,
    SaveAndStatusUpdate: 33,
    SaveAndNoStatusUpdate: 34,
    Rejected: 41,
    Delegate: 42,
    Hold: 43,
    Resume: 44,
    RestartToUpdate: 45
};
var jsFunctionValue = {
    Submit: 1,
    Guideline: 2,
    ConfirmSubmit: 3,
    SendOAAP: 4,
    ForwardAndSubmit: 5,
    SendApproval: 6,
    Print: 7,
    SendMail: 8,
    SubmitNoRedirect: 9,
    CancelMeeting: 10,
    SendMSDSDoc: 11,
    ExtractAttachments: 12,
    RescheduleMeetingPopup: 14,
    ReAssignAndSubmit: 15,
    MultipleReAssignAndSubmit: 16,
    ForwardAndSubmitWithComment: 17,
    ReAssignAndSubmitWithComment: 18,
    ChangePersonAndSubmit: 19,
    OpenChangeResponsiblePersonPopup: 20,
    OpenChangeSuggestionCoordinatorPopup: 21,
    GenerateLSMW: 22,
    ForwardPM: 23,
    SAPIntegration: 24,
    SubmitForm: 25,
    PrintWithAttachment: 26,
    OpenPrintModel: 27,
    ConfirmHold: 28,
    OnResume: 29,
    OnDelete: 30,
    ConfirmSubmitNoRedirect: 31
}

var ApproverStatus = {
    NOTASSIGNED: "Not Assigned",
    PENDING: "Pending",
    APPROVED: "Approved",
    COMPLETED: "Completed",
    SENDBACK: "Send Back",
    SENDFORWARD: "Send Forward",
    NOTREQUIRED: "Not Required"
}

var DayOfWeek = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
}

var SharePointPermission = {
    READER: "Read",
    CONTRIBUTOR: "Contribute"
}
