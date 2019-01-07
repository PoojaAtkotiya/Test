var globalApprovalMatrix;
var currentUserRole;
var localApprovalMatrixdata;
var activeSectionName = "";
var web, clientContext, oList, perMask;
var currentApproverList;
var tempApproverMatrix;
var tcurrentLevel;
var permItem = null;

function GetGlobalApprovalMatrix(id) {
    GetFormDigest().then(function (data) {
        $.ajax({
            url: "https://bajajelect.sharepoint.com/sites/WFRootDev" + "/_api/web/lists/getbytitle('" + globalApprovalMatrixName + "')/GetItems(query=@v1)?@v1={\"ViewXml\":\"<View><Query><Where><And><Eq><FieldRef Name='ApplicationName' /><Value Type='TaxonomyFieldType'>" + applicationName + "</Value></Eq><Eq><FieldRef Name='FormName' /><Value Type='Text'>" + formName + "</Value></Eq></And></Where></Query></View>\"}",
            type: "POST",
            headers:
                {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json; odata=verbose",
                    "X-RequestDigest": data.d.GetContextWebInformation.FormDigestValue
                },
            success: function (data) {
                globalApprovalMatrix = data.d.results;
                SetSectionWiseRoles(id = 0);
                SetApprovalMatrix(id, '');
                setCustomApprovers(tempApproverMatrix);
                GetButtons(id, currentUserRole, 'New');
            },
            error: function (data) {
                console.log(data.responseJSON.error);
            }
        });
    });
}

function GetLocalApprovalMatrixData(id, mainListName) {
    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + ItemCodeApprovalMatrixListName + "')/Items?$select=*,Approver/EMail,Approver/UserName&$expand=Approver&$filter=RequestID eq '" + id + "'&$orderby= Levels asc",
        type: "GET",
        async: false,
        headers:
            {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
        success: function (data) {
            localApprovalMatrixdata = data.d.results;
            SetSectionWiseRoles(id);
            SetApprovalMatrix(id, mainListName);
            setCustomApprovers(tempApproverMatrix);
        },
        error: function (data) {
            console.log(data);
        }
    });
}

function SetApprovalMatrix(id, mainListName) {
    if (id > 0) {
        //set role name from local approval matrix
        GetCurrentUserRole(id, mainListName).done(function () {
            GetEnableSectionNames(id);
            tempApproverMatrix = localApprovalMatrixdata;
            SetApproversInApprovalMatrix();
        }).fail(function () {
            console.log("Execute  second after the retrieve list items  failed");
        });
        //  GetCurrentUserRole(id, mainListName);
        //  GetEnableSectionNames(id);
        //  tempApproverMatrix = localApprovalMatrixdata;

    } else {
        currentUserRole = "Creator";
        //get active/inactive section name from globalApprovalMatrix
        GetEnableSectionNames(id = 0);
        tempApproverMatrix = globalApprovalMatrix;
        tempApproverMatrix.forEach(temp => {
            temp.RequestIDId = null;
            temp.Status = "";
            temp.Comments = "";
            temp.AssignDate = null;
            temp.DueDate = null;
            temp.ApprovalDate = null;
            temp.EscalationToId = null;
            temp.EscalationOn = null;
            temp.ApproveById = null;
            temp.ReasonForDelay = "";
            temp.ReasonForChange = "";
            temp.IsHOLD = "";
        });
        SetApproversInApprovalMatrix();

    }

    // GetMasterData(ApproverMasterListName);
    // var approverMaster = masterDataArray;
    // //set status(of all levels) and approver(current)
    // if (!IsNullOrUndefined(tempApproverMatrix) && tempApproverMatrix.length > 0) {
    //     ////Get all roles which have FillByRole = currentUserRole
    //     tempApproverMatrix.filter(function (t) {
    //         if (!IsNullOrUndefined(t.FillByRole) && !IsNullOrUndefined(currentUserRole) && t.FillByRole == currentUserRole) {
    //             if (!IsNullOrUndefined(approverMaster) && approverMaster.length > 0) {
    //                 approverMaster.filter(function (a) {
    //                     if (t.Role == a.Role && a.UserSelection == true) {
    //                         if (a.UserNameId.results.length > 0) {
    //                             a.UserNameId.results.forEach(userId => {
    //                                 t.ApproverId = t.ApproverId + userId + ",";
    //                             });
    //                         }
    //                         ////Trim , from last in approverId --------Pending
    //                         t.ApproverId = t.ApproverId.trim().substring(0, t.ApproverId.lastIndexOf(','));
    //                     }
    //                 });
    //             }
    //         }
    //         t.Status = "Not Assigned";
    //     });
    // }
}

function SetApproversInApprovalMatrix() {
    GetMasterData(ApproverMasterListName);
    var approverMaster = masterDataArray;
    //set status(of all levels) and approver(current)
    if (!IsNullOrUndefined(tempApproverMatrix) && tempApproverMatrix.length > 0) {
        ////Get all roles which have FillByRole = currentUserRole
        tempApproverMatrix.filter(function (t) {
            if (!IsNullOrUndefined(t.FillByRole) && !IsNullOrUndefined(currentUserRole) && t.FillByRole == currentUserRole) {
                if (!IsNullOrUndefined(approverMaster) && approverMaster.length > 0) {
                    approverMaster.filter(function (a) {
                        if (t.Role == a.Role && a.UserSelection == true) {
                            if (a.UserNameId.results.length > 0) {
                                // a.UserNameId.results.forEach(userId => {
                                //     t.ApproverId = t.ApproverId + userId + ",";
                                // });
                                t.ApproverId = a.UserNameId.results;
                            }
                            ////Trim , from last in approverId --------Pending ---- Not requried whwn array is passed
                            // t.ApproverId = t.ApproverId.trim().substring(0, t.ApproverId.lastIndexOf(','));
                        }
                    });
                }
            }
            t.Status = "Not Assigned";
        });
    }
}

function GetCurrentUserRole(id, mainListName) {
    var deferred = $.Deferred();
    web = currentContext.get_web();
    //currentUser = web.get_currentUser();
    oList = web.get_lists().getByTitle(mainListName);
    var oListItem = oList.getItemById(id);

    currentContext.load(oListItem, 'EffectiveBasePermissions', 'HasUniqueRoleAssignments', 'FormLevel', 'Status');
    //currentContext.load(currentUser);
    currentContext.load(web);

    currentContext.executeQueryAsync(function () {

        // console.log("Does the user has full permission in the web ? : "+oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb))
        // if(oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb) && oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.viewListItems)){
        //     console.log("user has ful control and read permission");
        // }
        // else if(oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb) && oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.editListItems)){
        //     console.log("user has ful control and edit permission");
        // }   
        if (oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.editListItems)) {
            console.log("user has edit permission");
            tcurrentLevel = oListItem.get_item('FormLevel').split("|")[1];

            //GetRoleFromApprovalMatrix(tcurrentLevel, id, currentUser.get_id());
            GetRoleFromApprovalMatrix(tcurrentLevel, id, currentUser.Id);
            GetButtons(id, currentUserRole, oListItem.get_item('Status'));
        }
        else if (oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.viewListItems)) {
            console.log("user has Read permission");
            currentUserRole = "Viewer";
            GetButtons(id, currentUserRole, oListItem.get_item('Status'));
        }
        else {
            console.log("user doesn't have edit permission");
        }
        deferred.resolve(currentUserRole);

    }, function (sender, args) {
        console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
        deferred.reject(currentUserRole);
    });


    return deferred.promise();



    // SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
    //     clientContext = new SP.ClientContext.get_current();
    //     web = clientContext.get_web();
    //     currentUser = web.get_currentUser();
    //     oList = web.get_lists().getByTitle(mainListName);
    //     var oListItem = oList.getItemById(id);

    //     clientContext.load(oListItem, 'EffectiveBasePermissions', 'HasUniqueRoleAssignments', 'FormLevel', 'Status');
    //     clientContext.load(currentUser);
    //     clientContext.load(web);
    //     //clientContext.load(web, 'EffectiveBasePermissions');

    //     clientContext.executeQueryAsync(function () {

    //         // console.log("Does the user has full permission in the web ? : "+oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb))
    //         // if(oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb) && oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.viewListItems)){
    //         //     console.log("user has ful control and read permission");
    //         // }
    //         // else if(oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb) && oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.editListItems)){
    //         //     console.log("user has ful control and edit permission");
    //         // }             
    //         if (oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.editListItems)) {
    //             console.log("user has edit permission");
    //             tcurrentLevel = oListItem.get_item('FormLevel').split("|")[1];

    //             GetRoleFromApprovalMatrix(tcurrentLevel);
    //             GetButtons(id, currentUserRole, oListItem.get_item('Status'));
    //         }
    //         else if (oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.viewListItems)) {
    //             console.log("user has Read permission");
    //             currentUserRole = "Viewer";
    //             GetButtons(id, currentUserRole, oListItem.get_item('Status'));
    //         }
    //         else {
    //             console.log("user doesn't have edit permission");
    //         }

    //     }, function (sender, args) {
    //         console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
    //     });
    // });
}

function GetRoleFromApprovalMatrix(tcurrentLevel, requestId, currUserId) {
    localApprovalMatrixdata.filter(function (i) {
        if (i.ApplicationName == applicationName && i.FormName == formName && i.Levels == tcurrentLevel && i.RequestIDId == requestId && (!IsNullOrUndefined(i.ApproverId) && !IsNullOrUndefined(i.ApproverId.results) && i.ApproverId.results.some(item => item == currUserId))) {
            currentUserRole = i.Role;
        }
    });
}

function GetEnableSectionNames(id) {
    if (id == 0) {
        //get active section name
        var activeSectionItem = globalApprovalMatrix.filter(function (i) {
            return (i.ApplicationName.Label == applicationName && i.FormName.Label == formName && i.Role == currentUserRole);
        })[0];

        activeSectionName = (!IsNullOrUndefined(activeSectionItem.SectionName) && !IsNullOrUndefined(activeSectionItem.SectionName.results) && !IsNullOrUndefined(activeSectionItem.SectionName.results.length > 0) && !IsNullOrUndefined(activeSectionItem.SectionName.results[0])) ? activeSectionItem.SectionName.results[0].Label : '';
        $('#divItemCodeForm div .card-body').filter(function () {
            var sectionName = $(this).attr('section');
            if (sectionName == activeSectionName) {
                var sectionId = $(this).attr('id');
                $("#" + sectionId).removeClass("disabled");
                $("#" + sectionId).find(':input').removeAttr("disabled");
            }
        });
        $("div .disabled .form-control").attr("disabled", "disabled");
    }
    else if (id > 0) {
        //get active section name
        var activeSectionItem = localApprovalMatrixdata.filter(function (l) {
            return (l.ApplicationName == applicationName && l.FormName == formName && l.Levels == tcurrentLevel && l.Role == currentUserRole);
        })[0];

        activeSectionName = activeSectionItem.SectionName;
        $('#divItemCodeForm div .card-body').filter(function () {
            var sectionName = $(this).attr('section');
            if (sectionName == activeSectionName) {
                var sectionId = $(this).attr('id');
                $("#" + sectionId).removeClass("disabled");
                $("#" + sectionId).find(':input').removeAttr("disabled");
            }
        });
        $("div .disabled .form-control").attr("disabled", "disabled");
    }
}

function SaveLocalApprovalMatrix(sectionName, requestId, mainListName, isNewItem, mainListItem, approvalMatrixListName, param) {
    var approvers = [];
    var status;
    var datas = [];

    var nextApprover = [], formLevel = '', nextApproverRole = '';

    var userEmail = "";

    var approvalMatrix;
    var approverList;

    var fillApprovalMatrix = [];

    var previousLevel = mainListItem.get_item('FormLevel').split("|")[0];
    var currentLevel = mainListItem.get_item('FormLevel').split("|")[1];
    var nextLevel = currentLevel;
    var proposedBy = mainListItem.get_item('ProposedBy');

    var sendToLevel = (!IsNullOrUndefined(param) && !IsNullOrUndefined(param["SendToLevel"])) ? param["SendToLevel"] : null;
    var formFieldValues = [];

    if (isNewItem) {
        var sectionOwner = currentUserRole;
        formFieldValues["ProposedBy"] = currentUser.Id;
        ////Save CurrentApprover as Creator in tempApprovalMatrix
        tempApproverMatrix.filter(function (temp) {
            if (temp.Role == "Creator") {
                temp.ApproverId = currentUser.Id;
                temp.RequestIDId = requestId;
            }
        });
    }
    else {
        //GetLocalApprovalMatrixData(requestId, mainListName);
        //if (localApprovalMatrixdata != null && localApprovalMatrixdata.length > 0) {
        //approvalMatrix = localApprovalMatrixdata;
        //}
    }

    ////Update status of all approvers in tempapprovalmatrix
    var actionperformed = buttonActionStatus;
    UpdateStatusofApprovalMatrix(tempApproverMatrix, currentLevel, previousLevel, actionperformed);

    ////Set NextApprover and NextApproverRole
    if (!IsNullOrUndefined(tempApproverMatrix) && tempApproverMatrix.length > 0) {
        ////set RequestID for all Roles
        tempApproverMatrix.forEach(t => {
            t.RequestIDId = requestId;
        });
        debugger
        if (actionperformed != "Send Back" && actionperformed != "Forward" && tempApproverMatrix.some(t => t.Levels != currentLevel)) {
            ////Get Next Level
            var nextLevelRow = tempApproverMatrix.sort(t => t.Levels).filter(function (temp) {
                return (temp.Status != "Not Required" && !IsNullOrUndefined(temp.ApproverId) && temp.Levels > currentLevel);
            })[0];
            nextLevel = (!IsNullOrUndefined(nextLevelRow)) ? nextLevelRow.Levels : nextLevel;

            var listofNextApprovers = tempApproverMatrix.filter(temp => temp.Levels == nextLevel);

            listofNextApprovers.forEach(next => {
                debugger
                if (isNewItem) {
                    if (!IsNullOrUndefined(next.ApproverId) && !IsStrNullOrEmpty(next.ApproverId)) {
                        if (nextApprover == '') {
                            nextApproverRole = next.Role;
                            nextApprover = next.ApproverId;
                        } else {
                            if (nextApprover.indexOf(next.ApproverId) == -1) // !Contains
                            {
                                nextApproverRole = nextApproverRole.trim() + "," + next.Role;
                                nextApprover = nextApprover.trim() + "," + next.ApproverId;
                            }
                        }
                    }
                } else {
                    if (!IsNullOrUndefined(next) && !IsNullOrUndefined(next.ApproverId) && !IsNullOrUndefined(next.ApproverId.results) && next.ApproverId.results.length > 0) {
                        if (nextApprover == '') {
                            nextApproverRole = next.Role;
                            nextApprover = next.ApproverId.results;
                        } else {
                            debugger
                            ////Pending to handle multiple approvers from local approval matrix
                            if (nextApprover.indexOf(next.ApproverId) == -1) // !Contains
                            {
                                nextApproverRole = nextApproverRole.trim() + "," + next.Role;
                                nextApprover = nextApprover.trim() + "," + next.ApproverId;
                            }
                        }
                    }
                }
            });
        }
        else {
            if (actionPerformed == "NextApproval" || actionPerformed == "Delegate") {
                debugger
                var approvers = tempApproverMatrix.sort(a => a.Levels).filter(a => a.Levels > currentLevel && !IsStrNullOrEmpty(a.ApproverId) && !IsNullOrUndefined(a.ApproverId) && a.Status != "Not Required")[0];
                if (!IsNullOrUndefined(approvers)) {
                    var listofNextApprovers = tempApproverMatrix.filter(temp => (temp.Levels == nextLevel && temp.Status == "Pending"));

                    listofNextApprovers.forEach(next => {
                        if (!IsNullOrUndefined(next.ApproverId) && !IsStrNullOrEmpty(next.ApproverId)) {
                            if (nextApprover == '') {
                                nextApproverRole = next.Role;
                                nextApprover = next.ApproverId;
                            }
                            else {
                                if (nextApprover.indexOf(next.ApproverId) == -1) {

                                    debugger;
                                    if (nextApproverRole.lastIndexOf(',') != -1) {
                                        nextApproverRole = nextApproverRole.trim().substring(0, nextApproverRole.lastIndexOf(','))
                                    }
                                    if (nextApprover.lastIndexOf(',') != -1) {
                                        nextApprover = nextApprover.trim().substring(0, nextApprover.lastIndexOf(','))
                                    }

                                    ///////////// TRIM is PENDING
                                    nextApproverRole = nextApproverRole.trim() + "," + next.Role;
                                    nextApprover = nextApprover.trim() + "," + next.ApproverId;
                                }
                            }
                        }
                    });
                }
                currentLevel = previousLevel;
            }
        }
        if (actionperformed == "SendBack" && !IsNullOrUndefined(sendToLevel)) {
            nextLevel = sendToLevel;
            var listofNextApprovers = tempApproverMatrix.filter(temp => (temp.Levels == nextLevel && temp.Status == "Pending"));
            nextApprover = '';
            listofNextApprovers.each(next => {
                if (!IsNullOrUndefined(next.ApproverId) && !IsStrNullOrEmpty(next.ApproverId)) {
                    if (nextApprover == []) {
                        nextApproverRole = next.Role;
                        nextApprover = next.ApproverId;
                    }
                    else {
                        if (nextApprover.indexOf(next.ApproverId) == -1) {
                            debugger;
                            if (nextApproverRole.lastIndexOf(',') != -1) {
                                nextApproverRole = nextApproverRole.trim().substring(0, nextApproverRole.lastIndexOf(','))
                            }
                            if (nextApproverRole.lastIndexOf(',') != -1) {
                                nextApprover = nextApprover.trim().substring(0, nextApprover.lastIndexOf(','))
                            }
                            ///////////// TRIM is PENDING
                            nextApproverRole = nextApproverRole.trim(',') + "," + next.Role;
                            nextApprover = nextApprover.trim(',') + "," + next.ApproverId;
                        }
                    }
                }

            });
        }
        if (actionperformed == "SendForward" && !IsNullOrUndefined(sendToLevel)) {
            nextLevel = sendToLevel;
            var approvers = tempApproverMatrix.sort(a => a.Levels).filter(a => a.Levels >= nextLevel && !IsStrNullOrEmpty(a.ApproverId) && !IsNullOrUndefined(a.ApproverId))[0];
            if (!IsNullOrUndefined(approvers)) {
                nextLevel = approvers.Levels;
                var listofNextApprovers = tempApproverMatrix.filter(temp => !IsNullOrUndefined(temp.ApproverId) && !IsStrNullOrEmpty(temp.ApproverId) && temp.Levels == nextLevel);
                nextApprover = '';
                listofNextApprovers.forEach(next => {
                    if (!IsNullOrUndefined(next.ApproverId) && !IsStrNullOrEmpty(next.ApproverId)) {
                        if (nextApprover == '') {
                            nextApproverRole = next.Role;
                            nextApprover = next.ApproverId;
                        }
                        else {
                            if (nextApprover.indexOf(next.ApproverId) == -1) {

                                ///////////// TRIM is PENDING
                                nextApproverRole = nextApproverRole + "," + next.Role;
                                nextApprover = nextApprover.trim() + "," + next.ApproverId;
                            }
                        }
                    }
                });
            }
        }
    }

    var makeAllUsersViewer = false;
    var isTaskAssignMailSend = false;
    switch (actionperformed) {
        case "SaveAsDraft":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            formFieldValues['Status'] = "Draft";
            formFieldValues['NextApprover'] = currentUser.Id;
            break;
        case "SaveAndStatusUpdate":
        case "SaveAndStatusUpdateWithEmail":
        case "ConfirmSave":
            formFieldValues['Status'] = "Save";
            break;
        case "Save":
            formFieldValues['Status'] = "Save";
            makeAllUsersViewer = true;
            break;
        case "Submit":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            formFieldValues['Status'] = "Submitted";
            makeAllUsersViewer = true;
            break;
        case "Hold":
            formFieldValues['Status'] = "Hold";
            formFieldValues['HoldDate'] = new Date().toLocaleDateString();
            formFieldValues['LastActionBy'] = currentUser.Id;
            formFieldValues['LastActionByRole'] = currentUserRole;
            formFieldValues['PendingWith'] = currentUserRole;
            break;
        case "Resume":
            formFieldValues['Status'] = "Submitted";
            formFieldValues['LastActionBy'] = currentUser.Id;
            formFieldValues['LastActionByRole'] = currentUserRole;
            formFieldValues['PendingWith'] = currentUserRole;
            break;
        case "UpdateAndRepublish":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            formFieldValues['Status'] = "Update & Republish";
            break;
        case "Reschedule":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            formFieldValues['Status'] = "Re-Scheduled";
            formFieldValues['IsReschedule'] = false;
            break;
        case "ReadyToPublish":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            formFieldValues['Status'] = "Ready to Publish";
            break;
        case "Delegate":
        case "NextApproval":
            debugger
            formFieldValues['LastActionPerformed'] = actionperformed;
            formFieldValues['LastActionBy'] = currentUser.Id;
            formFieldValues['LastActionByRole'] = currentUserRole;
            formFieldValues['PendingWith'] = nextApproverRole;
            if (!IsNullOrUndefined(nextApprover)) {
                formFieldValues['NextApprover'] = nextApprover;
                formFieldValues['FormLevel'] = currentLevel + "|" + nextLevel;
                formFieldValues['ApprovalStatus'] = "In Progress";
                formFieldValues['Status'] = "Submitted";
            }
            else {
                nextLevel = currentLevel;
                formFieldValues['NextApprover'] = '';
                formFieldValues['FormLevel'] = currentLevel + "|" + currentLevel;
                formFieldValues['ApprovalStatus'] = "Completed";
                formFieldValues['Status'] = "Completed";
                makeAllUsersViewer = true;
                isTaskAssignMailSend = true;
            }
            break;
        case "BackToCreator":
            formFieldValues['LastActionPerformed'] = actionperformed;
            formFieldValues['LastActionBy'] = currentUser.Id;
            formFieldValues['LastActionByRole'] = currentUserRole;
            formFieldValues['PendingWith'] = nextApproverRole;
            formFieldValues['NextApprover'] = '';
            formFieldValues['FormLevel'] = currentLevel + "|" + nextLevel;
            formFieldValues['Status'] = "Sent Back";
            break;
        case "Cancel":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            makeAllUsersViewer = true;
            formFieldValues['NextApprover'] = '';
            formFieldValues['PendingWith'] = '';
            formFieldValues['Status'] = "Cancelled";
            break;
        case "Rejected":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            makeAllUsersViewer = true;
            formFieldValues['Status'] = "Rejected";
            formFieldValues['NextApprover'] = '';
            formFieldValues['PendingWith'] = '';
            break;
        case "Complete":
            formFieldValues['ApprovalStatus'] = "Completed";
            formFieldValues['Status'] = "Completed";
            formFieldValues['FormLevel'] = currentLevel + "|" + currentLevel;
            formFieldValues['NextApprover'] = '';
            formFieldValues['PendingWith'] = '';
            makeAllUsersViewer = true;
            isTaskAssignMailSend = true;
            break;
        case "SendBack":
            formFieldValues['LastActionPerformed'] = actionperformed;
            if (!IsNullOrUndefined(sendToLevel)) {
                formFieldValues['NextApprover'] = nextApprover;
                formFieldValues['LastActionBy'] = currentUser.Id;
                formFieldValues['LastActionByRole'] = currentUserRole;
                formFieldValues['PendingWith'] = nextApproverRole;
                formFieldValues['FormLevel'] = currentLevel + "|" + nextLevel;
                formFieldValues['Status'] = "Sent Back";
            }
            break;
        case "RestartToUpdate":
            // Since it is restart case so we need to reset currlevel = 0 ;
            currentLevel = 0;
            formFieldValues['LastActionPerformed'] = actionPerformed;
            formFieldValues['NextApprover'] = nextApprover;
            formFieldValues['LastActionBy'] = currentUser.Id;
            formFieldValues['LastActionByRole'] = currentUserRole;
            formFieldValues['PendingWith'] = nextApproverRole;
            formFieldValues['FormLevel'] = currentLevel + "|" + nextLevel;
            formFieldValues['Status'] = "Submitted";
            break;
        case "SendForward":
            formFieldValues = { 'LastActionPerformed': actionPerformed };
            if (!IsNullOrUndefined(sendToLevel)) {
                nextLevel = sendToLevel;
                formFieldValues['LastActionBy'] = currentUser.Id;
                formFieldValues['LastActionByRole'] = currentUserRole;
                formFieldValues['PendingWith'] = nextApproverRole;
                if (!IsNullOrUndefined(nextApprover) && !IsStrNullOrEmpty(nextApprover)) {
                    formFieldValues['NextApprover'] = nextApprover;
                    formFieldValues['FormLevel'] = currentLevel + "|" + nextLevel;
                    formFieldValues['ApprovalStatus'] = "In Progress";
                    formFieldValues['Status'] = "Submitted";
                }
                else {
                    //Complete if no approver found
                    formFieldValues['NextApprover'] = nextApprover;
                    formFieldValues['FormLevel'] = currentLevel + "|" + nextLevel;
                    formFieldValues['ApprovalStatus'] = "In Progress";
                    formFieldValues['Status'] = "Submitted";
                    makeAllUsersViewer = true;
                    isTaskAssignMailSend = true;
                }
            }
            break;
        default:
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
    }

    if (!IsNullOrUndefined(formFieldValues)) {
        if (!IsNullOrUndefined(formFieldValues["Status"]) && !IsStrNullOrEmpty(formFieldValues["Status"])) {
            UpdateWorkflowStatus(formFieldValues);
        }

        ////saveFormFields in Main List
        SaveFormFields(formFieldValues, requestId);
    }

    ////save attachment

    ////save activity log

    ////set permission 
    var userWithRoles = GetPermissionDictionary(tempApproverMatrix, nextLevel, makeAllUsersViewer);
    SetItemPermission(requestId, ItemCodeProProcessListName, userWithRoles);

    console.log("Save Approver matrix");
    ////save approval matrix in list
    SaveApprovalMatrixInList(tempApproverMatrix, approvalMatrixListName, isNewItem);

    ////send mail

}

function SetItemPermission(requestId, ItemCodeProProcessListName, userWithRoles) {

    BreakRoleInheritance(requestId, ItemCodeProProcessListName).done(function () {
        var roleDefBindingColl = null;
        var users = [];
        userWithRoles.forEach((element) => {
            try {
                roleDefBindingColl = SP.RoleDefinitionBindingCollection.newObject(currentContext);
                var userIds = element.user;
                var permission = element.permission;
                if (!IsNullOrUndefined(userIds) && !IsStrNullOrEmpty(userIds) && !IsNullOrUndefined(permission) && !IsStrNullOrEmpty(permission)) {

                    //split users and remove ,
                    if (userIds.toString().indexOf(',') == 0) {
                        userIds = userIds.substring(1);
                        if (userIds.toString().indexOf(',') != -1 && userIds.toString().lastIndexOf(',') == userIds.toString().length - 1) {
                            userIds = userIds.substring(userIds.toString().lastIndexOf(','))[0];
                        }
                    }

                    if (!IsNullOrUndefined(userIds) && !IsStrNullOrEmpty(userIds)) {
                        var a = (userIds.toString().indexOf(',') != -1) ? userIds.split(',') : parseInt(userIds);

                        if (!IsNullOrUndefined(a)) {
                            if (a.length == undefined) {
                                users.push(a);
                            } else {
                                a.forEach(element => {
                                    users.push(parseInt(element));
                                });
                            }
                        }
                    }
                    users.forEach(user => {
                        if (!isNaN(user)) {
                            this.oUser = currentContext.get_web().getUserById(user);
                            roleDefBindingColl.add(currentContext.get_web().get_roleDefinitions().getByName(permission));
                            permItem.get_roleAssignments().add(this.oUser, roleDefBindingColl);
                            currentContext.load(oUser);
                            currentContext.load(permItem);
                            console.log("userId = " + user + "   ,permission = " + permission);

                            currentContext.executeQueryAsync(function () {
                                console.log("set permission : success User");

                            }, function () {
                                console.log("set permission : failed");

                            }
                            );
                        }
                    });
                }

            } catch (exc) {
                debugger
                console.log("catch : error while set permission");
                console.log(exc);
            }
        });
    }).fail(function () {
        console.log("Execute  second after the retrieve list items  failed");
    });

    // var permissionAssigned = false;
    // var dfd = $.Deferred();
    // if (!IsNullOrUndefined(userWithRoles)) {
    //     SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {

    //         var clientContext = new SP.ClientContext.get_current();
    //         var oList = clientContext.get_web().get_lists().getByTitle(ItemCodeProProcessListName);

    //         var oListItem = oList.getItemById(requestId);
    //         oListItem.resetRoleInheritance();
    //         oListItem.breakRoleInheritance(false, true); // break role inheritance first!

    //         var roleDefBindingColl = null;

    //         userWithRoles.forEach((element) => {
    //             try {
    //                 roleDefBindingColl = SP.RoleDefinitionBindingCollection.newObject(clientContext);
    //                 var userIds = element.user;
    //                 var permission = element.permission;
    //                 if (!IsNullOrUndefined(userIds) && !IsStrNullOrEmpty(userIds) && !IsNullOrUndefined(permission) && !IsStrNullOrEmpty(permission)) {

    //                     //split users and remove ,
    //                     if (userIds.toString().indexOf(',') == 0) {
    //                         userIds = userIds.substring(1);
    //                         if (userIds.toString().indexOf(',') != -1 && userIds.toString().lastIndexOf(',') == userIds.toString().length - 1) {
    //                             userIds = userIds.substring(userIds.toString().lastIndexOf(','))[0];
    //                         }
    //                     }
    //                     var users = [];
    //                     if (!IsNullOrUndefined(userIds) && !IsStrNullOrEmpty(userIds)) {
    //                         var a = (userIds.toString().indexOf(',') != -1) ? userIds.split(',') : parseInt(userIds);

    //                         if (!IsNullOrUndefined(a)) {
    //                             if (a.length == undefined) {
    //                                 users.push(a);
    //                             } else {
    //                                 a.forEach(element => {
    //                                     users.push(parseInt(element));
    //                                 });
    //                             }
    //                         }
    //                     }

    //                     users.forEach(user => {
    //                         this.oUser = clientContext.get_web().getUserById(user);
    //                         roleDefBindingColl.add(clientContext.get_web().get_roleDefinitions().getByName(permission));
    //                         oListItem.get_roleAssignments().add(this.oUser, roleDefBindingColl);
    //                         clientContext.load(oUser);
    //                         clientContext.load(oListItem);
    //                         console.log("userId = " + user + "   ,permission = " + permission);

    //                         clientContext.executeQueryAsync(function () {
    //                             console.log("set permission : success User");
    //                             dfd.resolve(oListItem);
    //                         }, function () {
    //                             console.log("set permission : failed");
    //                             dfd.reject(oListItem);
    //                         }
    //                         );
    //                     });
    //                 }

    //             } catch (exc) {
    //                 debugger
    //                 console.log("catch : error while set permission");
    //                 console.log(exc);
    //             }
    //         });
    //     });
    // }
    // return dfd.promise();
}

function BreakRoleInheritance(requestId, ItemCodeProProcessListName) {
    var deferred = $.Deferred();
    web = currentContext.get_web();
    var oList = web.get_lists().getByTitle(ItemCodeProProcessListName);
    permItem = oList.getItemById(requestId);
    //permItem.resetRoleInheritance();
    permItem.breakRoleInheritance(false, true); // break role inheritance first!
    currentContext.load(web);
    currentContext.load(permItem);
    currentContext.executeQueryAsync(function () {
        deferred.resolve(permItem);
    }, function (sender, args) {
        console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
        deferred.reject(permItem);
    });
    return deferred.promise();
}


function onSetItemPermissionFailed(sender, args) {
    console.log('onSetItemPermissionSucceeded : Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
}


function GetPermissionDictionary(tempApproverMatrix, nextLevel, isAllUserViewer) {
    var permissions = [];
    if (!IsNullOrUndefined(tempApproverMatrix) && tempApproverMatrix.length > 0) {
        var strReader = '';
        var strContributer = '';
        tempApproverMatrix.forEach(temp => {
            if (!IsNullOrUndefined(temp.ApproverId)) {
                // if (permissions.filter(k = k.key == temp.ApproverId).length == 0) {
                if (temp.Levels == nextLevel && temp.Status == "Pending") //ApproverStatus.PENDING)
                {
                    /* All users 
                     * 1) who are pending on current level
                     */
                    if (strContributer.indexOf(temp.ApproverId) == -1) {
                        // strContributer = strContributer.Trim(',') + "," + p.Approver;
                        strContributer = strContributer.trim() + "," + temp.ApproverId;
                    }
                }
                ////Phase 2 :All members who will be in the DCR Process should be able to know the status of all DCR/DCN. 
                //// else if (Convert.ToInt32(p.Levels) <= preLevel || (p.Levels == curLevel.ToString() && p.Status != ApproverStatus.PENDING))
                else if (temp.Status != ApproverStatus.PENDING)
                {
                    /* All users 
                     * 1) who are less then previous level
                     * 2) who are not pending on current level
                     */
                    if (strReader.indexOf(temp.ApproverId) == -1) {
                        strReader = strReader.trim() + "," + temp.ApproverId;
                    }
                }
                // }
            }
        });

        if (strReader.trim() == strContributer.trim()) {
            // permissions.push(strContributer.trim(), isAllUserViewer ? SharePointPermission.READER : SharePointPermission.CONTRIBUTOR);
            var user = strContributer.trim();
            var permission = isAllUserViewer ? 'Read' : 'Contribute';
            // var array = [{user: "21,22", permission : "Read"}]

            permissions.push({ user: user, permission: permission });
        }
        else {
            if (isAllUserViewer) {
                //permissions.Add(strReader.Trim(',') + "," + strContributer.Trim(','), SharePointPermission.READER);
                var user = strReader.trim() + "," + strContributer.trim();
                var permission = 'Read';
                permissions.push({ user: user, permission: permission });
            }
            else {
                var user = strReader.trim();
                var permission = 'Read';
                permissions.push({ user: user, permission: permission });

                var user1 = strContributer.trim();
                var permission1 = isAllUserViewer ? 'Read' : 'Contribute';
                permissions.push({ user: user1, permission: permission1 });
            }
        }
    }
    return permissions;
}

function SaveApprovalMatrixInList(tempApproverMatrix, approvalMatrixListName, isNewItem) {
    var url = '';
    var headers;
    tempApproverMatrix.forEach(temp => {
        //For multiUser field of sharepoint list
        var approverResults = [];
        if (isNewItem) {
            if (!IsNullOrUndefined(temp.ApproverId)) {
                debugger
                if (IsArray(temp.ApproverId)) {
                    approverResults = temp.ApproverId;
                }
                else {
                    approverResults.push(parseInt(temp.ApproverId));
                }
            }
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + approvalMatrixListName + "')/items";
            headers = {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "POST"
            };
            $.ajax({
                url: url,
                type: "POST",
                headers: headers,
                data: JSON.stringify
                    ({
                        __metadata: {
                            type: GetItemTypeForListName(approvalMatrixListName)
                        },
                        ApplicationName: temp.ApplicationName.Label,
                        FormName: temp.FormName.Label,
                        SectionName: (!IsNullOrUndefined(temp.SectionName) && !IsNullOrUndefined(temp.SectionName.results) && temp.SectionName.results.length > 0) ? temp.SectionName.results[0].Label : '',
                        //HiddenSection : temp.HiddenSection.results[0],
                        Levels: parseInt(temp.Levels),
                        Role: temp.Role,
                        Days: parseInt(temp.Days),
                        IsAutoApproval: temp.IsAutoApproval,
                        FillByRole: temp.FillByRole,
                        Division: temp.Division,
                        //SubDivision : 
                        ApproverId: { "results": approverResults },
                        Status: !IsNullOrUndefined(temp.Status) ? temp.Status.toString() : '',
                        Comments: !IsNullOrUndefined(temp.Comments) ? temp.Comments.toString() : '',
                        AssignDate: temp.AssignDate,
                        DueDate: temp.DueDate,
                        ApprovalDate: temp.ApprovalDate,
                        IsEscalate: temp.IsEscalate,
                        //EscalationToId: temp.EscalationToId,
                        //EscalationOn: temp.EscalationOn,
                        ApproveById: temp.ApproveById,
                        IsOptional: temp.IsOptional,
                        FormType: temp.FormType,
                        ReasonForDelay: !IsNullOrUndefined(temp.ReasonForDelay) ? temp.ReasonForDelay.toString() : '',
                        ReasonForChange: !IsNullOrUndefined(temp.ReasonForChange) ? temp.ReasonForChange.toString() : '',
                        IsReminder: temp.IsReminder,
                        IsHOLD: !IsNullOrUndefined(temp.IsHOLD) ? temp.IsHOLD.toString() : '',
                        RequestIDId: parseInt(temp.RequestIDId),
                        //Attachments: false,
                        //EscalationDays: temp.EscalationDays,
                        //EscalationToId: temp.EscalationToId,
                        //IsAutoRejection: temp.IsAutoRejection,
                        //Reminder: null,
                    }),
                success: function (data, status, xhr) {
                    console.log("SaveApprovalMatrixInList - Item saved Successfully");
                },
                error: function (data) {
                    debugger
                    console.log(data);
                }
            });
        }
        else {
            debugger
            if (!IsNullOrUndefined(temp.ApproverId)) {
                debugger
                if (IsArray(temp.ApproverId.results)) {
                    approverResults = temp.ApproverId.results;
                }
                else {
                    approverResults.push(parseInt(temp.ApproverId));
                }
            }
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + approvalMatrixListName + "')/items(" + temp.Id + ")";
            headers = {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "IF-MATCH": "*",
                "X-HTTP-Method": "MERGE"
            };
            $.ajax({
                url: url,
                type: "POST",
                headers: headers,
                data: JSON.stringify
                    ({
                        __metadata: {
                            type: GetItemTypeForListName(approvalMatrixListName)
                        },
                        // ApplicationName: temp.ApplicationName.Label,
                        // FormName: temp.FormName.Label,
                        // SectionName: (!IsNullOrUndefined(temp.SectionName) && !IsNullOrUndefined(temp.SectionName.results) && temp.SectionName.results.length > 0) ? temp.SectionName.results[0].Label : '',
                        // Levels: parseInt(temp.Levels),
                        // Role: temp.Role,
                        // Days: parseInt(temp.Days),
                        // IsAutoApproval: temp.IsAutoApproval,
                        // FillByRole: temp.FillByRole,
                        // Division: temp.Division,
                        ApproverId: { "results": approverResults },
                        Status: !IsNullOrUndefined(temp.Status) ? temp.Status.toString() : '',
                        Comments: !IsNullOrUndefined(temp.Comments) ? temp.Comments.toString() : '',
                        AssignDate: temp.AssignDate,
                        DueDate: temp.DueDate,
                        ApprovalDate: temp.ApprovalDate,
                        IsEscalate: temp.IsEscalate,
                        ApproveById: temp.ApproveById,
                        IsOptional: temp.IsOptional,
                        //FormType: temp.FormType,
                        ReasonForDelay: !IsNullOrUndefined(temp.ReasonForDelay) ? temp.ReasonForDelay.toString() : '',
                        ReasonForChange: !IsNullOrUndefined(temp.ReasonForChange) ? temp.ReasonForChange.toString() : '',
                        IsReminder: temp.IsReminder,
                        IsHOLD: !IsNullOrUndefined(temp.IsHOLD) ? temp.IsHOLD.toString() : '',
                        //RequestIDId: parseInt(temp.RequestIDId),
                    }),
                success: function (data, status, xhr) {
                    console.log("SaveApprovalMatrixInList - Item saved Successfully");
                },
                error: function (data, status, error) {
                    debugger
                    console.log("SaveApprovalMatrixInList - error" + data);
                }
            });
        }
    });
}

function SaveFormFields(formFieldValues, requestId) {
    debugger
    //For multiUser field of sharepoint list
    var nextResults = [];
    if (!IsNullOrUndefined(formFieldValues["NextApprover"]) && formFieldValues["NextApprover"].length > 0) {
        // var a = (formFieldValues["NextApprover"].indexOf(',') != -1 ? formFieldValues["NextApprover"].split(',') : formFieldValues["NextApprover"]);

        // if (!IsNullOrUndefined(a)) {
        //     a.forEach(element => {
        //         nextResults.push(parseInt(element));
        //     });
        // }

        nextResults = IsArray(formFieldValues["NextApprover"]) ? formFieldValues["NextApprover"] : nextResults;
    }


    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + ItemCodeProProcessListName + "')/items(" + requestId + ")",
        type: "POST",
        data: JSON.stringify
            ({
                __metadata: {
                    type: GetItemTypeForListName(ItemCodeProProcessListName)
                },
                FormLevel: formFieldValues["FormLevel"].toString(),
                NextApproverId: { "results": nextResults },
                LastActionBy: !IsNullOrUndefined(formFieldValues["LastActionBy"]) ? formFieldValues["LastActionBy"].toString() : '',
                LastActionByRole: formFieldValues["LastActionByRole"].toString(),
                PendingWith: formFieldValues["PendingWith"].toString(),
                Status: formFieldValues["Status"].toString(),
                WorkflowStatus: formFieldValues["WorkflowStatus"].toString()
                //ApprovalStatus : formFieldValues["ApprovalStatus"],
                //LastActionPerformed : formFieldValues["LastActionPerformed"],
                //IsReschedule: formFieldValues["IsReschedule"],
            }),
        headers:
            {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "IF-MATCH": "*",
                "X-Http-Method": "MERGE", //PATCH

            },
        success: function (data, status, xhr) {
            console.log("Item saved Successfully");
        },
        error: function (data, status, error) {
            debugger
            console.log(data);
        }
    });
}

function UpdateWorkflowStatus(formFieldValues) {
    var wfStatus = '';
    var formStatus = formFieldValues["Status"];
    var pendingWithRole = (!IsNullOrUndefined(formFieldValues["PendingWith"])) ? formFieldValues["PendingWith"] : '';
    var lastActionByRole = (!IsNullOrUndefined(formFieldValues["LastActionByRole"])) ? formFieldValues["LastActionByRole"] : '';
    if (!IsNullOrUndefined(formStatus) && !IsStrNullOrEmpty(formStatus)) {
        switch (formStatus) {
            case "Submitted":
                wfStatus = "Pending With " + pendingWithRole;
                break;
            case "Sent Back":
                wfStatus = "Sent back by " + lastActionByRole;
                break;
            default:
                wfStatus = formStatus;
                break;
        }
    }
    formFieldValues['WorkflowStatus'] = wfStatus;
}

function SetSectionWiseRoles(id) {
    if (id == 0) {
        ////Get data from global approval matrix
        if (!IsNullOrUndefined(globalApprovalMatrix) && globalApprovalMatrix.length > 0) {
            ////Compare by Section Name
            globalApprovalMatrix.filter(function (g) {
                $('#divItemCodeForm div').each(function () {
                    var divSection = $(this).attr('section');
                    if (!IsNullOrUndefined(divSection) && !IsNullOrUndefined(g.SectionName) && !IsNullOrUndefined(g.SectionName.results[0]) && !IsNullOrUndefined(g.SectionName.results[0].Label) && g.SectionName.results[0].Label == divSection) {
                        //// if section name are same, get Role and FillByRole
                        $(this).attr('sectionOwner', g.Role);
                        $(this).attr('FillByRole', g.FillByRole);
                    }
                });
            });
        }
    } else if (id > 0) {
        ////Get data from local approval matrix
        if (!IsNullOrUndefined(localApprovalMatrixdata) && localApprovalMatrixdata.length > 0) {
            ////Compare by Section Name
            localApprovalMatrixdata.filter(function (l) {
                $('#divItemCodeForm div').each(function () {
                    var divSection = $(this).attr('section');
                    if (!IsNullOrUndefined(divSection) && !IsNullOrUndefined(l.SectionName) && l.SectionName == divSection) {
                        //// if section name are same, get Role and FillByRole
                        $(this).attr('sectionOwner', l.Role);
                        $(this).attr('FillByRole', l.FillByRole);
                    }
                });
            });
        }
    }
}

function UpdateStatusofApprovalMatrix(tempApproverMatrix, currentLevel, previousLevel, actionperformed) {
    if (!IsNullOrUndefined(tempApproverMatrix) && tempApproverMatrix.length > 0 && !IsNullOrUndefined(currentUser.Id)) {

        if (currentLevel != previousLevel) {
            var currentUserId = currentUser.Id;
            // if (IsNullOrUndefined(currentUserId)) {
            //     currentUserId = currentUser.get_id();
            // }
            var nextLevel = currentLevel;

            switch (actionperformed) {
                case actionperformed = 'Delegate':
                case actionperformed = 'NextApproval':
                    tempApproverMatrix.filter(function (temp) {
                        ////right now searched by user Id, it may requires to check by name 
                        if (!IsNullOrUndefined(temp.ApproverId) && temp.Levels == currentLevel && temp.ApproverId.toString().includes(currentUserId)) {
                            temp.Status = "Approved";  ////ApproverStatus.APPROVED;  -----Gives error as not defined
                        }
                    });
                    ////Get Next Level
                    var nextLevelRow = tempApproverMatrix.sort(t => t.Levels).filter(function (temp) {
                        return (temp.Status != "Not Required" && !IsNullOrUndefined(temp.ApproverId) && temp.Levels > currentLevel);
                    })[0];

                    nextLevel = (!IsNullOrUndefined(nextLevelRow)) ? nextLevelRow.Levels : nextLevel;

                    var dueDate = null;
                    tempApproverMatrix.forEach(temp => {
                        if (!IsNullOrUndefined(temp.ApproverId) && temp.Levels == currentLevel && temp.ApproverId.toString().includes(currentUserId)) {
                            temp.ApproveById = currentUserId;
                            temp.ApprovalDate = new Date().format("yyyy-MM-ddTHH:mm:ssZ");
                            temp.Status = "Approved";
                        }
                        else if (temp.Levels == nextLevel && (temp.Status != "Approved" && temp.Status != "Not Required")) {
                            temp.DueDate = GetDueDate(new Date(), parseInt(temp.Days));
                            temp.AssignDate = new Date().format("yyyy-MM-ddTHH:mm:ssZ");
                            temp.Status = "Pending";
                        }
                        else if (temp.Levels > nextLevel && temp.Status != "Not Required") {
                            temp.Status = "Not Assigned";
                            temp.AssignDate = null;
                            temp.DueDate = null;
                            temp.Comments = '';
                        }
                    });
            }
        }
    }
}

function GetDueDate(startDate, days) {
    ////Count from Next Day
    startDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    for (var i = 0; i < days; i++) {
        var date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        var day = date.getDay();
        switch (day) {
            //case DayOfWeek.Saturday:
            //case DayOfWeek.Sunday:
            case 6:
            case 0:
                days++;
                break;
            default:
                // if (holidays.Contains(date.ToString("dd/MM")))
                // {
                //days++;
                //}
                break;
        }
    }
    dueDate = new Date(startDate.getTime() + ((days - 1) * 24 * 60 * 60 * 1000)).format("yyyy-MM-ddTHH:mm:ssZ");
    return dueDate;
}