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
    }

    var approverMaster = GetMasterData(ApproverMasterListName);
    //set status(of all levels) and approver(current)
    if (tempApproverMatrix != null && tempApproverMatrix != undefined && tempApproverMatrix.length > 0) {
        ////Get all roles which have FillByRole = currentUserRole
        tempApproverMatrix.filter(function (t) {
            if (t.FillByRole != undefined && t.FillByRole != null && currentUserRole != undefined && t.FillByRole == currentUserRole) {
               if(approverMaster != null && approverMaster != undefined && approverMaster.length >0){
                   approverMaster.filter(function (a) {
                        if(t.Role == a.Role && t.UserSelection == true){
                            t.ApproverId = a.UserNameId;
                        }
                   });
               }
            }
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

function SaveLocalApprovalMatrix(sectionName, requestId, mainListName, isNewItem, mainListItem, approvalMatrixListName) {
    var approvers = [];
    var status;
    var datas = [];

    var nextApprover = '', formLevel = '', nextApproverRole = '';

    var userEmail = "";

    var approvalMatrix;
    var approverList;

    var fillApprovalMatrix = [];

    var previousLevel = mainListItem.get_item('FormLevel').split("|")[0];
    var currentLevel = mainListItem.get_item('FormLevel').split("|")[1];
    var nextLevel = currentLevel;
    var proposedBy = mainListItem.get_item('ProposedBy');

    if (isNewItem) {
        approvalMatrix = globalApprovalMatrix;
        var sectionOwner = currentUserRole;
        //  currentApproverList = GetCurrentApproverDetails(currentUserRole, sectionOwner, $(approvalMatrix));
        fillApprovalMatrix = CommonApprovalMatrix(approvalMatrix, sectionName, proposedBy, requestId);
    }
    else {
        GetLocalApprovalMatrixData(requestId, mainListName);
        if (localApprovalMatrixdata != null && localApprovalMatrixdata.length > 0) {
            approvalMatrix = localApprovalMatrixdata;
            //  currentApproverList = GetCurrentApproverDetails(currentUserRole, sectionOwner, $(approvalMatrix));
            fillApprovalMatrix = CommonApprovalMatrix(approvalMatrix, sectionName, proposedBy, requestId);
        }
    }
    currentApproverList = CommonCurrentApprovalMatrix(approvalMatrix, sectionName)
    if (fillApprovalMatrix != null) {
        approverList = fillApprovalMatrix;
        $(approvalMatrix).each(function (i, e) {
            $(approverList).each(function (j, et) {
                $(e)[0].RequestIDId = requestId;
                if ($(et)[0].Role == $(e)[0].Role && $(et)[0].Levels != null && $(et)[0].Levels == $(e).Levels) {
                    $(e)[0].ApproverId = ($(et)[0].ApproverId != '' && $(et)[0].ApproverId != undefined) ? $(et)[0].ApproverId : $(e)[0].ApproverId;
                    $(e)[0].Status = ($(et)[0].Status != '' && $(et)[0].Status != undefined) ? $(et)[0].Status : $(e)[0].Status;
                    if ($(et)[0].Role == $(e)[0].Role && $(et)[0].Levels != null && $(et)[0].Levels == $(e).Levels)
                        $(e)[0].Comments = ($(et)[0].Comments != '' && $(et)[0].Comments != undefined) ? $(et)[0].Comments : $(e)[0].Comments;
                }
                else {
                    if ($(et)[0].Role == $(e)[0].Role) {
                        $(e)[0].ApproverId = ($(et)[0].ApproverId != '' && $(et)[0].ApproverId != undefined) ? $(et)[0].ApproverId : $(e)[0].ApproverId;
                        $(e)[0].Status = ($(et)[0].Status != '' && $(et)[0].Status != undefined) ? $(et)[0].Status : $(e)[0].Status;
                        if ($(et)[0].Role == $(e)[0].Role && $(et)[0].Levels != null && $(et)[0].Levels == $(e).Levels)
                            $(e)[0].Comments = ($(et)[0].Status != '' && $(et)[0].Comments != undefined) ? $(et)[0].Comments : $(e)[0].Comments;
                    }
                }
            });
        });
    }

    if (approvalMatrix != null) {
        userIDs = currentUser.Id;
        $(approvalMatrix).each(function (i, e) {
            if ($(e)[0].Role == "Viewer" && (userIDs != '' && userIDs != undefined)) {
                if ($(e).ApproverId == '' || $(e)[0].ApproverId == null || $(e)[0].ApproverId == undefined) {
                    $(e)[0].ApproverId = userIDs;
                }
                else {
                    $(e)[0].ApproverId = $(e)[0].ApproverId + "," + userIDs;
                }
                $(e)[0].ApproverId = $(e)[0].ApproverId;
            }
        });
    }
    if (currentApproverList != null) {
        $(approvalMatrix).each(function (i, e) {
            if ($(e)[0].Role == currentApproverList[0].Role) {
                if (currentApproverList[0].Comments != undefined && currentApproverList[0].Comments != '') {
                    if (currentApproverList[0].Levels != undefined && currentApproverList[0].Levels != '') {
                        if ($(e)[0].Role == currentApproverList[0].Role && $(e)[0].Levels == currentApproverList[0].Levels) {
                            $(e)[0].Comments = currentApproverList[0].Comments;
                        }
                    }
                    else {
                        if ($(e)[0].Role == currentApproverList[0].Role) {
                            $(e)[0].Comments = currentApproverList[0].Comments;
                        }
                    }
                }
                if (currentApproverList[0].ApproverId != undefined && currentApproverList[0].ApproverId != '') {
                    if ($(e)[0].Role == currentApproverList[0].Role) {
                        $(e)[0].ApproverId = currentApproverList[0].ApproverId;
                    }
                }
                if (currentApproverList[0].ReasonForChange != undefined && currentApproverList[0].ReasonForChange != '') {
                    if ($(e)[0].Role == currentApproverList[0].Role) {
                        $(e)[0].ReasonForChange = currentApproverList[0].ReasonForChange;
                    }
                }
                if (currentApproverList[0].ReasonForDelay != undefined && currentApproverList[0].ReasonForDelay != '') {
                    if ($(e)[0].Role == currentApproverList[0].Role) {
                        $(e)[0].ReasonForDelay = currentApproverList[0].ReasonForDelay;
                    }
                }
                if (currentApproverList[0].Files != undefined && currentApproverList[0].Files != '' && currentApproverList[0].Files != null && currentApproverList[0].Files.length > 0) {
                    if ($(e)[0].Role == currentApproverList[0].Role && $(e)[0].Files == null) {
                        $(e)[0].Files = [];
                    }
                    else {
                        if ($(e)[0].Role == currentApproverList[0].Role) {
                            $(e)[0].Files = currentApproverList[0].Files;
                        }
                    }
                }
            }
        });
    }
    if (approvalMatrixListName != null) {
        $(approvalMatrix).each(function (i, e) {
            if ($(e)[0].Role != undefined && $(e)[0].ApproverId != undefined) {
                var userRole = $(e)[0].Role.replace(/\s+/g, '');
                if ($(e)[0].Levels == currentLevel && $(e)[0].Status == "Not Assigned") {
                    $(e)[0].Status = "Pending";
                    $(e)[0].DueDate = new Date();
                    $(e)[0].AssignDate = new Date();
                }
            }
        });
    }

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
            SetFormLevel(requestId, mainListName, localApprovalMatrixdata);
        },
        error: function (data) {

            console.log(data);
        }
    });
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