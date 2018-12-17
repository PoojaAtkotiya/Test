var globalApprovalMatrix;
var currentUserRole;
var localApprovalMatrixdata;
var activeSectionName = "";
var web, clientContext, currentUser, oList, perMask;
var currentApproverList;
var tempApproverMatrix;
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
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + approverMatrixListName + "')/Items?$select=*,Approver/EMail,Approver/UserName&$expand=Approver&$filter=RequestID eq '" + id + "'&$orderby= Levels asc",
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
        },
        error: function (data) {
            console.log(data);
        }
    });
}
function SetApprovalMatrix(id, mainListName) {
    debugger;
    if (id > 0) {
        //set role name from globalApprovalMatrix
        GetCurrentUserRole(id, mainListName);
        GetEnableSectionNames(id);
        tempApproverMatrix = localApprovalMatrixdata;
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
    }

    GetMasterData(ApproverMasterListName);
    var approverMaster = masterDataArray;
    //set status(of all levels) and approver(current)
    if (tempApproverMatrix != null && tempApproverMatrix != undefined && tempApproverMatrix.length > 0) {
        ////Get all roles which have FillByRole = currentUserRole
        tempApproverMatrix.filter(function (t) {
            if (t.FillByRole != undefined && t.FillByRole != null && currentUserRole != undefined && t.FillByRole == currentUserRole) {
                if (approverMaster != null && approverMaster != undefined && approverMaster.length > 0) {
                    approverMaster.filter(function (a) {
                        if (t.Role == a.Role && a.UserSelection == true) {
                            if (a.UserNameId.results.length > 0) {
                                a.UserNameId.results.forEach(userId => {
                                    t.ApproverId = t.ApproverId + userId + ",";
                                });
                            }
                            ////Trim , from last in approverId --------Pending
                            t.ApproverId = t.ApproverId.trim().substring(0, t.ApproverId.lastIndexOf(','));
                        }
                    });
                }
            }
            t.Status = "Not Assigned";
        });
    }
}

function GetCurrentUserRole(id, mainListName) {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        clientContext = new SP.ClientContext.get_current();
        web = clientContext.get_web();
        currentUser = web.get_currentUser();
        oList = web.get_lists().getByTitle(mainListName);
        var oListItem = oList.getItemById(id);

        clientContext.load(oListItem, 'EffectiveBasePermissions', 'HasUniqueRoleAssignments', 'FormLevel', 'Status');
        clientContext.load(currentUser);
        clientContext.load(web);
        //clientContext.load(web, 'EffectiveBasePermissions');

        clientContext.executeQueryAsync(function () {
            // console.log("Does the user has full permission in the web ? : "+oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb))
            // if(oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb) && oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.viewListItems)){
            //     console.log("user has ful control and read permission");
            // }
            // else if(oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.manageWeb) && oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.editListItems)){
            //     console.log("user has ful control and edit permission");
            // }             
            if (oListItem.get_effectiveBasePermissions().has(SP.PermissionKind.editListItems)) {
                console.log("user has edit permission");
                var currentLevel = oListItem.get_item('FormLevel').split("|")[1];

                GetRoleFromApprovalMatrix(currentLevel);
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

        }, function (sender, args) {
            console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
        });
    });
}

function GetRoleFromApprovalMatrix(currentLevel) {
    localApprovalMatrixdata.filter(function (i) {
        if (i.ApplicationName == applicationName && i.FormName == formName && i.Levels == currentLevel) {
            currentUserRole = i.Role;
            activeSectionName = i.SectionName;
            activeSectionName = activeSectionName.replace(/ /g, '').trim().toUpperCase();
            $("#" + activeSectionName).removeClass("disabled");
            $("div .disabled .form-control").attr("disabled", "disabled");
        }
    });
}

function GetEnableSectionNames(id) {
    if (id == 0) {
        //get active section name
        globalApprovalMatrix.filter(function (i) {
            if (i.ApplicationName.Label == applicationName && i.FormName.Label == formName && i.Role == currentUserRole) {
                activeSectionName = i.SectionName;
                activeSectionName = activeSectionName.results[0].Label.replace(/ /g, '').trim().toUpperCase();
                $("#" + activeSectionName).removeClass("disabled");
                $("div .disabled .form-control").attr("disabled", "disabled");
            }
        });
    }
    else if (id > 0) {
        //get active section name
        localApprovalMatrixdata.filter(function (l) {
            if (l.ApplicationName == applicationName && l.FormName == formName && l.Role == currentUserRole) {
                activeSectionName = l.SectionName;
                activeSectionName = activeSectionName.results[0].Label.replace(/ /g, '').trim().toUpperCase();
                $("#" + activeSectionName).removeClass("disabled");
                $("div .disabled .form-control").attr("disabled", "disabled");
            }
        });
    }
}

function CommonApprovalMatrix(approvalMatrix, sectionName, proposedBy, requestId) {
    var fillApprovalMatrix = [];
    var sectionOwner;
    $(approvalMatrix).each(function (i, e) {
        if ($(e)[0].SectionName.results[0] != undefined && $(e)[0].SectionName.results[0].Label != '' && $(e)[0].SectionName.results[0].Label == sectionName) {
            sectionOwner = $(e)[0].Role;
        }
        if ($(e)[0].FillByRole != null && $(e)[0].FillByRole == sectionOwner && $(e)[0].Role != "Viewer") {
            fillApprovalMatrix.push($(e)[0]);
        }
        if ($(e)[0].Role == "Creator") {
            $(e)[0].ApproverId = proposedBy;
            $(e)[0].RequestID = requestId;
        }
        $(e)[0].Status = "Not Assigned";
    });

    return fillApprovalMatrix;
}

function CommonCurrentApprovalMatrix(approvalMatrix, sectionName) {
    var fillApprovalMatrix = [];
    var sectionOwner;
    $(approvalMatrix).each(function (i, e) {
        if ($(e)[0].SectionName.results[0] != undefined && $(e)[0].SectionName.results[0].Label != '' && $(e)[0].SectionName.results[0].Label == sectionName) {
            sectionOwner = $(e)[0].Role;
        }
        if ($(e)[0].Role != null && $(e)[0].Role == sectionOwner) {
            if (currentApproverList != null && currentApproverList[0].Role == sectionOwner) {
                currentApproverList[0].ApproverId = currentUser.Id;
            }
        }
    });

    return fillApprovalMatrix;
}

function GetCurrentApproverDetails(role, sectionOwner, approverMatrix) {
    var approverDetail = null;
    var roleApprovers = [];
    $(approverMatrix).each(function (i, e) {
        if ($(e)[0].Role != undefined && $(e)[0].Role != '' && $(e)[0].FillByRole == sectionOwner && $(e)[0].Status != "Approved") {
            roleApprovers.push($(e)[0]);
        }
        else {
            if ($(e)[0].Role != undefined && $(e)[0].Role != '' && $(e)[0].FillByRole == sectionOwner)
                approverDetail = $(e)[0];
        }
    });
    $(approverMatrix).each(function (i, e) {
        $(roleApprovers).each(function (i, et) {
            if (approverDetail == null && (($(e)[0].Levels == $(et)[0].Levels && $(e)[0].IsOptional == false && $(e)[0].Status == "Pending") || ($(e)[0].Levels == $(et)[0].Levels && $(e)[0].Status == "Approved"))) {
                if ($(e)[0].Role == sectionOwner && $(e)[0].Levels == $(et)[0].Levels)
                    approverDetail = $(e)[0];
            }
        });
    });
    return approverDetail;
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

    var sendToLevel = (param != null && param != undefined && param["SendToLevel"] != undefined && param["SendToLevel"] != null) ? param["SendToLevel"] : null;
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

        ////and for all other approver's status= "Not Assigned" in tempApprovalMatrix ------------ Done

        //  currentApproverList = GetCurrentApproverDetails(currentUserRole, sectionOwner, $(approvalMatrix));
        //fillApprovalMatrix = CommonApprovalMatrix(approvalMatrix, sectionName, proposedBy, requestId);
    }
    else {
        //GetLocalApprovalMatrixData(requestId, mainListName);
        //if (localApprovalMatrixdata != null && localApprovalMatrixdata.length > 0) {
        //approvalMatrix = localApprovalMatrixdata;
        //currentApproverList = GetCurrentApproverDetails(currentUserRole, sectionOwner, $(approvalMatrix));
        //fillApprovalMatrix = CommonApprovalMatrix(approvalMatrix, sectionName, proposedBy, requestId);
        //}
    }

    ////Update status of all approvers in tempapprovalmatrix
    var actionperformed = buttonActionStatus;
    UpdateStatusofApprovalMatrix(tempApproverMatrix, currentLevel, previousLevel, actionperformed);

    ////Set NextApprover and NextApproverRole
    if (tempApproverMatrix != null && tempApproverMatrix != undefined && tempApproverMatrix.length > 0) {
        ////set RequestID for all Roles
        tempApproverMatrix.forEach(t => {
            t.RequestIDId = requestId;
        });

        if (actionperformed != "Send Back" && actionperformed != "Forward" && tempApproverMatrix.some(t => t.Levels != currentLevel)) {
            ////Get Next Level
            var nextLevelRow = tempApproverMatrix.sort(t => t.Levels).filter(function (temp) {
                return (temp.Status != "Not Required" && temp.ApproverId != null && temp.ApproverId != undefined && temp.Levels > currentLevel);
            })[0];
            nextLevel = (nextLevelRow != null && nextLevelRow != undefined) ? nextLevelRow.Levels : nextLevel;

            var listofNextApprovers = tempApproverMatrix.filter(temp => temp.Levels == nextLevel);

            listofNextApprovers.forEach(next => {
                if (next.ApproverId != null && next.ApproverId != undefined && next.ApproverId != '') {
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
            });
        }
        else {
            if (actionPerformed == "NextApproval" || actionPerformed == "Delegate") {
                var approvers = tempApproverMatrix.sort(a => a.Levels).filter(a => a.Levels > currentLevel && a.ApproverId != '' && a.ApproverId != undefined && a.ApproverId != null && a.Status != "Not Required")[0];
                if (approvers != null) {
                    var listofNextApprovers = tempApproverMatrix.filter(temp => (temp.Levels == nextLevel && temp.Status == "Pending"));

                    listofNextApprovers.forEach(next => {
                        if (next.ApproverId != undefined && next.ApproverId != null && next.ApproverId != '') {
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
                                    if (nextApproverRole.lastIndexOf(',') != -1) {
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
        if (actionperformed == "SendBack" && sendToLevel != null) {
            nextLevel = sendToLevel;
            var listofNextApprovers = tempApproverMatrix.filter(temp => (temp.Levels == nextLevel && temp.Status == "Pending"));
            nextApprover = '';
            listofNextApprovers.each(next => {
                if (next.ApproverId != null && next.ApproverId != '' && next.ApproverId != undefined) {
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
        if (actionperformed == "SendForward" && sendToLevel != null) {
            nextLevel = sendToLevel;
            var approvers = tempApproverMatrix.sort(a => a.Levels).filter(a => a.Levels >= nextLevel && a.ApproverId != '' && a.ApproverId != undefined && a.ApproverId != null)[0];
            if (approvers != null) {
                nextLevel = approvers.Levels;
                var listofNextApprovers = tempApproverMatrix.filter(temp => temp.ApproverId != '' && temp.ApproverId != null && temp.ApproverId != undefined && temp.Levels == nextLevel);
                nextApprover = '';
                listofNextApprovers.forEach(next => {
                    if (next.ApproverId != '' && next.ApproverId != undefined && next.ApproverId != null) {
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
            formFieldValues['NextApprover'] = currentUserId;
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
            formFieldValues['LastActionPerformed'] = actionperformed;
            formFieldValues['LastActionBy'] = currentUser.Id;
            formFieldValues['LastActionByRole'] = currentUserRole;
            formFieldValues['PendingWith'] = nextApproverRole;
            if (nextApprover != "" && nextApprover != null) {
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
            if (sendToLevel != null) {
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
            if (sendToLevel != null) {
                nextLevel = sendToLevel;
                formFieldValues['LastActionBy'] = currentUser.Id;
                formFieldValues['LastActionByRole'] = currentUserRole;
                formFieldValues['PendingWith'] = nextApproverRole;
                if (nextApprover != undefined && nextApprover != '' && nextApprover != null) {
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
    debugger;
    if (formFieldValues != null && formFieldValues != undefined) {
        if (formFieldValues["Status"] != undefined && formFieldValues["Status"] != null && formFieldValues["Status"] != '') {
            UpdateWorkflowStatus(formFieldValues);
        }

        ////saveFormFields in Main List
        SaveFormFields(formFieldValues, requestId);

        ////save attachment

        ////save activity log

        ////save approval matrix
        ////set permission

        ////send mail
    }

    ////set permission 

    ////save approval matrix in list
    SaveApprovalMatrixInList(tempApproverMatrix, approvalMatrixListName, isNewItem);

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + approvalMatrixListName + "')/Items?$select=*,Approver/EMail,Approver/UserName&$expand=Approver&$filter=RequestID eq '" + requestId + "'&$orderby= Levels asc",
        type: "GET",
        async: false,
        headers:
            {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
        success: function (data) {
            SetFormLevel(requestId, mainListName, tempApproverMatrix);
        },
        error: function (data) {

            console.log(data);
        }
    });
}

function SaveApprovalMatrixInList(tempApproverMatrix, approvalMatrixListName, isNewItem) {
    if (isNewItem) {
        tempApproverMatrix.forEach(temp => {
            debugger
            ////For multiUser field of sharepoint list
            var approverResults = [];
            if (temp.ApproverId != null && temp.ApproverId != undefined && temp.ApproverId != '') {
                var a = (temp.ApproverId.toString().indexOf(',') != -1) ? temp.ApproverId.split(',') : parseInt(temp.ApproverId);

                if (a != null && a != undefined) {
                    if (a.length == undefined) {
                        approverResults.push(a);
                    } else {
                        a.forEach(element => {
                            approverResults.push(parseInt(element));
                        });
                    }
                }
            }
            $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + approvalMatrixListName + "')/items",
                type: "POST",
                data: JSON.stringify
                    ({
                        __metadata: {
                            type: GetItemTypeForListName(approvalMatrixListName)
                        },
                        ApplicationName: temp.ApplicationName.Label,
                        FormName: temp.FormName.Label,
                        SectionName: (temp.SectionName != IsNullOrUndefined && temp.SectionName.results != IsNullOrUndefined && temp.SectionName.results.length > 0) ? temp.SectionName.results[0].Label : '',
                        //HiddenSection : temp.HiddenSection.results[0],
                        Levels: parseInt(temp.Levels),
                        Role: temp.Role,
                        Days: parseInt(temp.Days),
                        IsAutoApproval: temp.IsAutoApproval,
                        FillByRole: temp.FillByRole,
                        Division: temp.Division,
                        //SubDivision : 
                        ApproverId: { "results": approverResults },
                        Status: temp.Status.toString(),
                        Comments: temp.Comments.toString(),
                        AssignDate: temp.AssignDate,
                        DueDate: temp.DueDate,
                        ApprovalDate: temp.ApprovalDate,
                        IsEscalate: temp.IsEscalate,
                        //EscalationToId: temp.EscalationToId,
                        //EscalationOn: temp.EscalationOn,
                        ApproveById: temp.ApproveById,
                        IsOptional: temp.IsOptional,
                        FormType: temp.FormType,
                        ReasonForDelay: temp.ReasonForDelay.toString(),
                        ReasonForChange: temp.ReasonForChange.toString(),
                        IsReminder: temp.IsReminder,
                        IsHOLD: temp.IsHOLD.toString(),
                        RequestIDId: parseInt(temp.RequestIDId),

                        //ApproverStringId:,
                        //Attachments: false,
                        //EscalationDays: temp.EscalationDays,
                        //EscalationToId: temp.EscalationToId,
                        //IsAutoRejection: temp.IsAutoRejection,
                        //Reminder: null,
                    }),
                headers:
                    {
                        "Accept": "application/json;odata=verbose",
                        "Content-Type": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                        "X-HTTP-Method": "POST"
                    },
                success: function (data, status, xhr) {
                    console.log("Item saved Successfully");
                },
                error: function (data, status, error) {
                    debugger
                    console.log(data);
                }
            });
        });

    }
    else {

    }
}

function SaveFormFields(formFieldValues, requestId) {

    //For multiUser field of sharepoint list
    var nextResults = [];
    if (formFieldValues["NextApprover"] != null && formFieldValues["NextApprover"] != undefined && formFieldValues["NextApprover"].length > 0) {
        var a = (formFieldValues["NextApprover"].indexOf(',') != -1 ? formFieldValues["NextApprover"].split(',') : formFieldValues["NextApprover"]);

        if (a != null && a != undefined) {
            a.forEach(element => {
                nextResults.push(parseInt(element));
            });
        }
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
                LastActionBy: formFieldValues["LastActionBy"].toString(),
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
    var pendingWithRole = (formFieldValues["PendingWith"] != null && formFieldValues["PendingWith"] != undefined) ? formFieldValues["PendingWith"] : '';
    var lastActionByRole = (formFieldValues["LastActionByRole"] != null && formFieldValues["LastActionByRole"] != undefined) ? formFieldValues["LastActionByRole"] : '';
    if (formStatus != '' && formStatus != null && formStatus != undefined) {
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
        if (globalApprovalMatrix != null && globalApprovalMatrix != undefined && globalApprovalMatrix.length > 0) {
            ////Compare by Section Name
            globalApprovalMatrix.filter(function (g) {
                $('#divItemCodeForm div').each(function () {
                    var divSection = $(this).attr('section');
                    if (divSection != undefined && g.SectionName != undefined && g.SectionName.results[0] != undefined && g.SectionName.results[0].Label != undefined && g.SectionName.results[0].Label == divSection) {
                        //// if section name are same, get Role and FillByRole
                        $(this).attr('sectionOwner', g.Role);
                        $(this).attr('FillByRole', g.FillByRole);
                    }
                });
            });
        }
    } else if (id > 0) {
        ////Get data from local approval matrix
        if (localApprovalMatrixdata != null && localApprovalMatrixdata != undefined && localApprovalMatrixdata.length > 0) {
            ////Compare by Section Name
            localApprovalMatrixdata.filter(function (l) {
                $('#divItemCodeForm div').each(function () {
                    var divSection = $(this).attr('section');
                    if (divSection != undefined && l.SectionName != undefined && l.SectionName.results[0] != undefined && l.SectionName.results[0].Label != undefined && l.SectionName.results[0].Label == divSection) {
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
    if (tempApproverMatrix != null && tempApproverMatrix != undefined && tempApproverMatrix.length > 0 && currentUser.Id != undefined) {

        if (currentLevel != previousLevel) {
            debugger;
            var currentUserId = currentUser.Id;
            var nextLevel = currentLevel;

            switch (actionperformed) {
                case actionperformed = 'Delegate':
                case actionperformed = 'NextApproval':
                    tempApproverMatrix.filter(function (temp) {
                        ////right now searched by user Id, it may requires to check by name 
                        if (temp.ApproverId != null && temp.ApproverId != undefined && temp.Levels == currentLevel && temp.ApproverId.toString().includes(currentUserId)) {
                            temp.Status = "Approved";  ////ApproverStatus.APPROVED;  -----Gives error as not defined
                        }
                    });
                    ////Get Next Level
                    var nextLevelRow = tempApproverMatrix.sort(t => t.Levels).filter(function (temp) {
                        return (temp.Status != "Not Required" && temp.ApproverId != null && temp.ApproverId != undefined && temp.Levels > currentLevel);
                    })[0];

                    nextLevel = (nextLevelRow != null && nextLevelRow != undefined) ? nextLevelRow.Levels : nextLevel;

                    var dueDate = null;
                    tempApproverMatrix.forEach(temp => {
                        if (temp.ApproverId != undefined && temp.ApproverId != null && temp.Levels == currentLevel && temp.ApproverId.toString().includes(currentUserId)) {
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
    debugger
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