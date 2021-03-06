const CommonConstant = {
    SPSITEURL : _spPageContextInfo.webAbsoluteUrl,
    ROOTURL : "https://bajajelect.sharepoint.com/sites/WFRootDev/",
    SPHOST :"https://bajajelect.sharepoint.com/npddev/",
    HOSTWEBURL : "https://bajajelect.sharepoint.com/sites/MTDEV",
    APPLICATIONSHORTNAME : "ICDM",
    APPLICATIONNAME : "Item Code Creation Preprocess",
    FORMNAME : "Item Code Preprocess Form",
    HTMLFILSEPATH:_spPageContextInfo.webAbsoluteUrl + "/SiteAssets/ItemCodeCreation/HTMLFiles/",
   BREAKROLEINHERITANCEWF :"https://prod-01.centralindia.logic.azure.com:443/workflows/bd5c7b59e0a245a5866865a147ce48f1/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DQwBHAeVbuK9CUlGJNABP7iG2ZSOE3ApijO8S0gWZM8",
   SETPERMISSIONWF:"https://prod-05.centralindia.logic.azure.com:443/workflows/94440494d1bc4839b196891de76d4d5f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-uan_RC5TIGT5AYnvbqT3CcjsJ2gapWn-KSQrUIE60E",
   GLOBALDATEFORMAT :'mm-dd-yyyy'
}
Object.freeze(CommonConstant);

const ListNames = {
    ICDMMAINLIST: "ItemCodeProProcess",
    ICDMACTIVITYLOGLIST: "ItemCodeActivityLog",
    ICDMAPPROVALMATRIXLIST: "ItemCodeApprovalMatrix",
    APPROVERMASTERLIST: "ApproverMaster",
    GLOBALAPPROVALMATRIXLIST: "ApprovalMatrix",
    BUTTONLIST: "Buttons"
}
Object.freeze(ListNames);

const ConstantKeys = {
    SENDTOLEVEL: 'SendToLevel',
    SENDTOROLE: 'SendToRole',
    SENDBACKTO: 'SendBackTo',
    ACTIONPERFORMED: 'ActionPerformed',
}
Object.freeze(ConstantKeys);

////here button action status is set as per ID(list item id) not 'value' column as we are getting lookup id from buttons
const ButtonActionStatus = {
    None: 1,
    SaveAsDraft: 2,
    Save: 3,
    ReadyToPublish: 4,
    SendMailNotification: 5,
    Exit: 6,
    Print: 7,
    Reschedule: 8,
    Cancel: 9,
    Replace: 10,
    NextApproval: 11,
    BackToCreator: 12,
    Guidelines: 13,
    ReAssign: 14,
    Complete: 15,
    Forward: 16,
    Integrate: 17,
    SaveAsDraftAndSetPermission: 18,
    SaveAndSetPermission: 19,
    NextApprovalAndSetPermission: 20,
    SendOAAP: 21,
    MeetingConducted: 22,
    SendBack: 23,
    MeetingNotConducted: 24,
    CopySchedule: 25,
    SendForward: 26,
    Submit: 27,
    Counducted: 28,
    UpdateAndRepublish: 29,
    GenerateLSMW: 30,
    UpdateAndReschedule: 31,
    ConfirmSave: 32,
    SaveAndStatusUpdate: 33,
    SaveAndNoStatusUpdate: 34,
    SaveAndStatusUpdateWithEmail: 35,
    SaveAndNoStatusUpdateWithEmail: 36,
    SendForSAP: 37,
    ReviseDate: 38,
    RemovedTask: 39,
    RemovedTask: 40,
    Rejected: 41,
    Delegate: 42,
    Hold: 43,
    Resume: 44,
    RestartToUpdate: 45
}
Object.freeze(ButtonActionStatus);

const JsFunctionValue = {
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
Object.freeze(JsFunctionValue);

const ApproverStatus = {
    NOTASSIGNED: "Not Assigned",
    PENDING: "Pending",
    APPROVED: "Approved",
    COMPLETED: "Completed",
    SENDBACK: "Send Back",
    SENDFORWARD: "Send Forward",
    NOTREQUIRED: "Not Required"
}
Object.freeze(ApproverStatus);

const DayOfWeek = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
}
Object.freeze(DayOfWeek);

const SharePointPermission = {
    READER: "Read",
    CONTRIBUTOR: "Contribute"
}
Object.freeze(SharePointPermission);

const CurrentApprover = {
    APPROVERID: "ApproverId",
    COMMENTS: "Comments",
    ASSIGNDATE: "AssignDate",
    DUEDATE: "DueDate",
    APPROVEBYID: "ApproveById",
    STATUS: "Status"
}
Object.freeze(CurrentApprover);


const Roles = {
    CREATOR: "Creator",
    VIEWER: "Viewer",
    EDITOR: "Editor",
    ICCPADMIN: "ICCP Admin",
    LUMMARKETINGINCHARGE: "LUM Marketing Incharge",
    LUMMARKETINGDELEGATE: "LUM Marketing Delegate",
    SCMLUMDESIGNINCHARGE: "LUM Design Incharge",
    SCMLUMDESIGNDELEGATE: "LUM Design Delegate",
    SMSINCHARGE: "SMS Incharge",
    SMSDELEGATE: "SMS Delegate",
    QAINCHARGE: "QA Incharge",
    QADELEGATE: "QA Delegate",
    FINALSMSINCHARGE: "Final SMS Incharge",
    FINALSMSDELEGATE: "Final SMS Delegate",
    COSTINGINCHARGE: "Costing Incharge",
    COSTINGDELEGATE1: "Costing Delegate1",
    COSTINGDELEGATE2: "Costing Delegate2",
    TDSINCHARGE: "TDS Incharge",
    TDSDELEGATE: "TDS Delegate"
}
Object.freeze(Roles);


const SectionNames =
    {
        LUMMKTINCHARGESECTION: "LUM Marketing Incharge Section",
        LUMMKTDELEGATEESECTION: "LUM Marketing Delegate Section",
        SCMLUMDESIGNINCHARGESECTION: "SCM LUM Design Incharge Section",
        SCMLUMDESIGNDELEGATESECTION: "SCM LUM Design Delegate Section",
        SMSINCHARGESECTION: "SMS Incharge Section",
        SMSDELEGATESECTION: "SMS Delegate Section",
        QAINCHARGESECTION: "QA Incharge Section",
        QADELEGATESECTION: "QA Delegate Section",
        FINALSMSINCHARGESECTION: "Final SMS Incharge Section",
        FINALSMSDELEGATESECTION: "Final SMS Delegate Section",
        COSTINGINCHARGESECTION: "Costing Incharge Section",
        COSTINGDELEGATE1SECTION: "Costing Delegate1 Section",
        COSTINGDELEGATE2SECTION: "Costing Delegate2 Section",
        TDSINCHARGESECTION: "TDS Incharge Section",
        TDSDELEGATESECTION: "TDS Delegate Section",
        ACTIVITYLOG: "Activity Log"
    }
Object.freeze(SectionNames);
