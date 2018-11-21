var globalApprovalMatrix;
var currentUserRole;
var localApprovalMatrixdata;
var activeSectionName = "";
var web, clientContext, currentUser, oList, perMask;
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
            SetApprovalMatrix(id, mainListName);
        },
        error: function (data) {
            console.log(data);
        }
    });
}

function SetApprovalMatrix(id, mainListName) {
    if (id > 0) {
        //set role name from globalApprovalMatrix
        GetCurrentUserRole(id, mainListName);
    } else {
        currentUserRole = "Creator";
        //get active/inactive section name from globalApprovalMatrix
        GetEnableSectionNames();
    }
    //set status(of all levels) and approver(current) from globalApprovalMatrix
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

function GetEnableSectionNames() {
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

function SaveLocalApprovalMatrix(sectionName,requestId, mainListName, isNewItem, approvalMatrixListName) {
    var approvers = [];
    var status;
    var datas = [];
    var currLevel = 0, nextLevel = 0, previousLevel = 0;
    var nextApprover = '', formLevel = '', nextApproverRole = '', currentUserRole = '';
    var web, clientContext;
    var userEmail = "";
    var proposedBy = "";
    var approvalMatrix;
    var approverList;
    var fillApprovalMatrix;
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        clientContext = new SP.ClientContext.get_current();
        web = clientContext.get_web();
        oList = web.get_lists().getByTitle(mainListName);
        var oListItem = oList.getItemById(requestId);

        clientContext.load(oListItem, 'FormLevel', 'CreatedBy');
        clientContext.load(web);
        //clientContext.load(web, 'EffectiveBasePermissions');

        clientContext.executeQueryAsync(function () {
            previousLevel = oListItem.get_item('FormLevel').split("|")[0];
            currentLevel = oListItem.get_item('FormLevel').split("|")[1];
            nextLevel = currentLevel;
            proposedBy = oListItem.get_item('CreatedBy')
        }, function (sender, args) {
            console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
        });
    });

    if (isNewItem) {
        approvalMatrix = globalApprovalMatrix;

        var sectionOwner = currentUserRole;
        $(approvalMatrix).each(function (i, e) {
            if ($(e).SectionName != '' && $(e).SectionName==sectionName) {
                sectionOwner = $(e).Role;
            }
            if ($(e).FillByRole != null && $(e).FillByRole == sectionOwner && $(e).Role != "Viewer") {
                fillApprovalMatrix.push($(e));
            }
            if ($(e).Role == "CREATOR") {
                $(e).Approver = proposedBy;
                $(e).RequestID = requestId;
            }
            $(e).Status = "Not Assigned";
        });
    }
    else {
        GetLocalApprovalMatrixData(requestId, mainListName);
        if (localApprovalMatrixdata != null && localApprovalMatrixdata.length > 0) {
            approvalMatrix = localApprovalMatrixdata;
        }
    }
    
    if (fillApprovalMatrix != null) {
        approverList = fillApprovalMatrix;
        $(approvalMatrix).each(function (i, e) {
            $(approverList).each(function (j, et) {
                $(e).RequestIDId = requestId;
                if ($(et).Role == $(e).Role && $(et).Levels != null && $(et).Levels == $(e).Levels) {
                    $(e).Approver = ($(et).Approver != '' && $(et).Approver != undefined) ? $(et).Approver : $(e).Approver;
                    $(e).Status = ($(et).Status != '' && $(et).Status != undefined) ? $(et).Status : $(e).Status;
                    if ($(et).Role == $(e).Role && $(et).Levels != null && $(et).Levels == $(e).Levels)
                        $(e).Comments = ($(et).Comments != '' && $(et).Comments != undefined) ? $(et).Comments : $(e).Comments;
                }
                else {
                    if ($(et).Role == $(e).Role) {
                        $(e).Approver = ($(et).Approver != '' && $(et).Approver != undefined) ? $(et).Approver : $(e).Approver;
                        $(e).Status = ($(et).Status != '' && $(et).Status != undefined) ? $(et).Status : $(e).Status;
                        if ($(et).Role == $(e).Role && $(et).Levels != null && $(et).Levels == $(e).Levels)
                            $(e).Comments = ($(et).Status != '' && $(et).Comments != undefined) ? $(et).Comments : $(e).Comments;
                    }
                }
            });
        });
    }

    if (approvalMatrix != null) {
        userIDs = currentUser.Id;
        $(approvalMatrix).each(function (i, e) {
            if ($(e).Role == "Viewer" && (userIDs != '' && userIDs != undefined)) {
                if ($(e).Approver == '' || $(e).Approver == null || $(e).Approver == undefined) {
                    $(e).Approver = userIDs;
                }
                else {
                    $(e).Approver = $(e).Approver + "," + userIDs;
                }
                $(e).Approver = $(e).Approver.trim(',');
            }
        });
    }

    for (var i = 0; i < globalApprovalMatrix.length - 1; i++) {
        if (globalApprovalMatrix[i].FillByRole == "Creator") {
            if (approverMaster[i] != null && approverMaster[i] != undefined && approverMaster[i].Role != undefined) {
                if (globalApprovalMatrix[i].Role == approverMaster[i].Role) {
                    approvers.push(approverMaster[i].UserNameId.results[0]);
                }
                if (globalApprovalMatrix[i].Role == "Creator") {
                    status = "Approved";
                }
                else {
                    status = "Not Assigned";
                }
                var row = {
                    Title: globalApprovalMatrix[i].SectionName.results[0].Label,
                    Levels: globalApprovalMatrix[i].Levels,
                    Role: globalApprovalMatrix[i].Role,
                    IsReminder: globalApprovalMatrix[i].IsReminder,
                    IsEscalate: globalApprovalMatrix[i].IsEscalate,
                    FillByRole: globalApprovalMatrix[i].FillByRole,
                    Status: status,
                    ApproverId: {
                        results: [approvers]
                    },
                    //ApproveById: vm.getcurrentuser.Id,
                    Days: globalApprovalMatrix[i].Days,
                    FormName: globalApprovalMatrix[i].FormName.Label,
                    SectionName: globalApprovalMatrix[i].SectionName.results[0].Label,
                    ApplicationName: globalApprovalMatrix[i].ApplicationName.Label,
                    RequestIDId: requestId
                }
                datas.push(row);
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
                datas
            }),
        headers:
        {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        },
        //async: true,
        success: function (data) {
            GetLocalApprovalMatrixData(requestId, mainListName);
            SetFormLevel(requestId, mainListName, localApprovalMatrixdata);
        },
        error: function (data) {

            console.log(data);
        }
    });

}
