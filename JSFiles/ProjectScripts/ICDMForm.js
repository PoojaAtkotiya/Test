var listName = ItemCodeProProcessListName;
var appName = applicationName;
var formName = "Item Code Preprocess Form";

var listItemId;
var formData = {};
var mainListData = {};
var listData = [];

var sendToLevel = "0";

$(document).ready(function () {
    listItemId = getUrlParameter("ID");
    returnUrl = getUrlParameter("Source");

    ////Get Current user details
    GetCurrentUserDetails();

    GetAllMasterData();
    //For Temporary
    GetApproverMaster();

    if (listItemId != null && listItemId > 0) {
        GetSetFormData();
    }
    else {
        // activeSectionName = "LUMMARKETINGINCHARGESECTION";
        // $("#" + activeSectionName).removeClass("disabled");
        // $("div .disabled .form-control").attr("disabled", "disabled");

        GetGlobalApprovalMatrix(listItemId);
    }

    //get buttons using appname, formname, rolename and status

});




//function GetAllMasterData() {
//    $('input[listtype*=master],select[listtype*=master]').each(function () {
//        var listType = $(this).attr('listtype');
//        var listname = $(this).attr('listname');
//        if (masterlistNameArray.indexOf(listname) < 0) {
//            masterlistNameArray.push(listname);
//        }

//    });
//    if (masterlistNameArray != null && masterlistNameArray.length > 0) {
//        $(masterlistNameArray).each(function (i, e) {
//            GetMasterData(masterlistNameArray[i]);
//        });
//    }
//}

//function GetMasterData(masterlistname) {
//    if (masterlistname != undefined && masterlistname != '' && masterlistname != null) {
//        $.ajax
//            ({
//                url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + masterlistname + "')/items",
//                type: "GET",
//                async: false,
//                headers:
//                {
//                    "Accept": "application/json;odata=verbose",
//                    "Content-Type": "application/json;odata=verbose",
//                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
//                },
//                success: function (data) {
//                    if (data != null && data != undefined && data.d != null && data.d.results != null) {
//                        var result = data.d.results;
//                        $('input[listname*=' + masterlistname + '],select[listname*=' + masterlistname + ']').each(function () {
//                            var elementId = $(this).attr('id');
//                            var elementType = $(this).attr('controlType');
//                            var valueBindingColumn = $(this).attr('valuebindingcolumn');
//                            var textBindingColumnn = $(this).attr('textbindingcolumnn');
//                            switch (elementType) {
//                                case "combo":
//                                    $("#" + elementId).html('');
//                                    $("#" + elementId).html("<option value=''>Select</option>");

//                                    if (valueBindingColumn != '' && textBindingColumnn != '' && valueBindingColumn != undefined && textBindingColumnn != undefined) {
//                                        $(result).each(function (i, e) {
//                                            var cmditem = result[i];
//                                            var opt = $("<option/>");
//                                            opt.text(cmditem[textBindingColumnn]);
//                                            opt.attr("value", cmditem[valueBindingColumn]);
//                                            opt.appendTo($("#" + elementId));
//                                        });
//                                    }
//                                    break;
//                                case "listbox":
//                                    break;
//                            }
//                        });
//                    }

//                },
//                error: function (data) {
//                    console.log($("#" + elementId).html(data.responseJSON.error));
//                }
//            });
//    }
//    else {
//        console.log("Master List Name is undefined.");
//    }
//}

//function SaveTranListData(lookupId) {
//    TranListData(lookupId);
//    tranListData = {};
//    if (tranlistNameArray != null && tranlistNameArray.length > 0) {
//        $(tranlistNameArray).each(function (i, e) {
//            SetTranDataValues(tranlistNameArray[i], lookupId);
//        });
//    }
//}

//function SetTranDataValues(tranlistname, lookupId) {
//    if (tranlistname != undefined && tranlistname != '' && tranlistname != null) {
//        $('input[listname*=' + tranlistname + '],select[listname*=' + tranlistname + '],radio[listname*=' + tranlistname + '],textarea[listname*=' + tranlistname + ']').each(function () {
//            var elementId = $(this).attr('id');
//            var elementType = $(this).attr('controlType');
//            tranListData = GetFormControlsValue(elementId, elementType, tranListData);
//        });
//        SaveTranData(tranlistname, tranListData, lookupId);
//    }
//}

//function SaveTranData(listname, tranListDataArray, lookupId) {
//    var itemType = GetItemTypeForListName(listname);
//    if (tranListDataArray != null) {
//        tranListDataArray["__metadata"] = {
//            "type": itemType
//        };

//        if (listname != undefined && listname != '' && listname != null) {
//            $.ajax({
//                url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items?$select=Author/Title,*&$expand=Author&$filter=RequestID eq '" + lookupId + "'",
//                type: "GET",
//                async: false,
//                headers:
//                {
//                    "Accept": "application/json;odata=verbose",
//                    "Content-Type": "application/json;odata=verbose",
//                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
//                },
//                success: function (data) {
//                    var item = data.d.results[0];
//                    if (item != null && item != '' & item != undefined) {
//                        tranListDataArray.ID = item.ID;
//                    }
//                    //   cancel();
//                }
//            });
//        }

//        //  tranListDataArray.ID = IsTranDataExists(listname, lookupId);

//        var url = '', headers = '';
//        if (tranListDataArray.ID == null || tranListDataArray.ID == '' || tranListDataArray.ID == undefined) {
//            tranListDataArray.ID = 0;
//            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items";
//            headers = { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val() };
//        }
//        else {
//            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items(" + tranListDataArray.ID + ")";
//            headers = { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val(), "IF-MATCH": "*", "X-HTTP-Method": "MERGE" };
//        }
//        tranListDataArray.RequestIDId = parseInt(lookupId);
//        console.log(tranListDataArray);

//        $.ajax({
//            url: url,
//            type: "POST",
//            contentType: "application/json;odata=verbose",
//            data: JSON.stringify(tranListDataArray),
//            headers: headers,
//            success: function (data) {
//                alert("Data saved successfully.");
//            },
//            error: function (data) {
//                console.log(data);
//            }
//        });
//    }
//}

//function GetFormControlsValue(id, elementType, listDataArray) {
//    var obj = '#' + id;
//    switch (elementType) {
//        case "text":
//            listDataArray[id] = $(obj).val();
//            break;
//        case "terms":
//            var metaObject = {
//                __metadata: { "type": "SP.Taxonomy.TaxonomyFieldValue" },
//                Label: $("select#" + id + ">option:selected").text(),
//                TermGuid: $(obj).val(),
//                WssId: -1
//            }
//            listDataArray[id] = metaObject;
//            break;
//        case "combo":
//            listDataArray[id] = $(obj).val();
//            break;
//        case "multitext":
//            listDataArray[id] = $(obj).val();
//            break;
//        case "date":
//            listDataArray[id] = $(obj).val();
//            break;
//        case "checkbox":
//            listDataArray[id] = $(obj)[0]['checked'];
//            break;
//        case "multicheckbox":
//            var parenType = $(obj).attr('cParent');
//            if (listDataArray[parenType] == undefined)
//                listDataArray[parenType] = { "__metadata": { "type": "Collection(Edm.String)" }, "results": [] };

//            var isChecked = $(obj)[0]['checked'];
//            var choiceName = $(obj)[0].id;
//            var idx = listDataArray[parenType].results.indexOf(choiceName);
//            if (isChecked && idx == -1)
//                listDataArray[parenType].results.push(choiceName);
//            else if (idx > -1)
//                listDataArray[parenType].results.splice(idx, 1);
//            break;
//        case "radiogroup":
//            var parenType = $(obj).attr('cParent');
//            listDataArray[parenType] = $(obj)[0].id;
//            break;
//    }
//    return listDataArray;
//}
function SaveFormData() {
    var mainListName = $('#divItemCodeForm').attr('mainlistname');
    if (mainListName != undefined && mainListName != '' && mainListName != null) {

        $('#divItemCodeForm').find('div[section]').not(".disabled").each(function (i, e) {
            var sectionName = $(e).attr('section');
            $(e).find('input[listtype=main],select[listtype=main],radio[listtype=main],textarea[listtype=main],label[listtype=main],input[reflisttype=main],select[reflisttype=main],radio[reflisttype=main],textarea[reflisttype=main],label[reflisttype=main]').each(function () {
                var elementId = $(this).attr('id');
                var elementType = $(this).attr('controlType');
                mainListData = GetFormControlsValue(elementId, elementType, mainListData);
            });
            var formList = $('#frm'+sectionName);
            var isValid = true;
            formList.each(function () {
                if (!$(this).valid()) {
                    isValid = false;
                    try {
                        var validator = $(this).validate();
                        $(validator.errorList).each(function (i, errorItem) {
                            console.log("{ '" + errorItem.element.id + "' : '" + errorItem.message + "'}");
                        });
                    }
                    catch (e1) {
                        console.log(e1.message);
                    }
                }
            });
            if (isValid) {
                SaveData(mainListName, mainListData, sectionName);
            }
        });
    }
}

function SaveData(listname, listDataArray, sectionName) {
    var itemType = GetItemTypeForListName(listname);
    var isNewItem = true;
    if (listDataArray != null) {
        listDataArray["__metadata"] = {
            "type": itemType
        };
        console.log(listDataArray);
        var url = '', headers = '';
        if (listItemId != null && listItemId > 0 && listItemId != "") {
            listDataArray.ID = listItemId;
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items(" + listItemId + ")";
            headers = { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val(), "IF-MATCH": "*", "X-HTTP-Method": "MERGE" };
            isNewItem = false;
        }
        else {
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items";
            headers = { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val() };
        }

        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(listDataArray),
            headers: headers,
            success: function (data) {
                listData = data.d;
                var itemID = listItemId;
                if (data != undefined && data != null && data.d != null) {
                    itemID = data.d.ID;
                }
                var web, clientContext;
                SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
                    clientContext = new SP.ClientContext.get_current();
                    web = clientContext.get_web();
                    oList = web.get_lists().getByTitle(listname);
                    var oListItem = oList.getItemById(itemID);

                    clientContext.load(oListItem, 'FormLevel', 'ProposedBy');
                    clientContext.load(web);
                    //clientContext.load(web, 'EffectiveBasePermissions');

                    clientContext.executeQueryAsync(function () {

                        SaveLocalApprovalMatrix(sectionName, itemID, listname, isNewItem, oListItem, ItemCodeApprovalMatrixListName);

                        if (data != undefined && data != null && data.d != null) {
                            SaveTranListData(itemID);
                        }
                        else {
                            SaveTranListData(itemID);
                        }
                    }, function (sender, args) {
                        console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
                    });
                });

                // GetLocalApprovalMatrix();
            },
            error: function (data) {
                console.log(data);
            }
        });
    }
}

//function TranListData(lookupId) {
//    tranlistNameArray = [];
//    $('input[listtype*=tran],select[listtype*=tran],radio[listtype*=tran],textarea[listtype*=tran]').each(function () {
//        var listType = $(this).attr('listtype');
//        var listname = $(this).attr('listname');
//        if (tranlistNameArray.indexOf(listname) < 0) {
//            tranlistNameArray.push(listname);
//        }
//    });

//}

//function GetTranListData(lookupId) {
//    TranListData(lookupId);
//    if (tranlistNameArray != null && tranlistNameArray.length > 0) {
//        $(tranlistNameArray).each(function (i, e) {
//            GetTranData(tranlistNameArray[i], lookupId);
//        });
//    }
//}

//function IsTranDataExists(tranlistname, lookupId) {

//}

//function GetTranData(tranlistname, lookupId) {
//    if (tranlistname != undefined && tranlistname != '' && tranlistname != null) {
//        $.ajax({
//            url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + tranlistname + "')/items?$select=Author/Title,*&$expand=Author&$filter=RequestID eq '" + lookupId + "'",
//            type: "GET",
//            async: false,
//            headers:
//            {
//                "Accept": "application/json;odata=verbose",
//                "Content-Type": "application/json;odata=verbose",
//                "X-RequestDigest": $("#__REQUESTDIGEST").val()
//            },
//            success: function (data) {
//                var item = data.d.results[0];
//                if (item != null && item != '' & item != undefined) {
//                    $('input[listname*=' + tranlistname + '],select[listname*=' + tranlistname + '],radio[listname*=' + tranlistname + '],textarea[listname*=' + tranlistname + ']').each(function () {
//                        var elementId = $(this).attr('id');
//                        var elementType = $(this).attr('controlType');

//                        setFieldValue(elementId, item, elementType, elementId);
//                    });
//                }
//                if (tranlistname == "ItemCodeApprovalMatrix") {
//                    localApprovalMatrix = data;
//                    if (listItemId > 0 && localApprovalMatrix != null && localApprovalMatrix != undefined && localApprovalMatrix.d.results.length > 0) {
//                        localApprovalMatrix.d.results.filter(function (i) {
//                            if (i.Status == "Pending" && i.ApproverId.results.indexOf(this.currentUser.Id) >= 0) {
//                                activeSectionName = i.SectionName;
//                                activeSectionName = activeSectionName.replace(/ /g, '').trim().toUpperCase();
//                                $("#" + activeSectionName).removeClass("disabled");
//                                $("div .disabled .form-control").attr("disabled", "disabled");
//                            }
//                        });
//                    }
//                }
//            }

//        });


//    }
//}


function GetSetFormData() {
    GetTranListData(listItemId);
    var mainListName = $('#divItemCodeForm').attr('mainlistname');
    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + mainListName + "')/items(" + listItemId + ")?$select=Author/Title,*&$expand=Author",
        type: "GET",
        async: false,
        headers:
            {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
        success: function (data) {
            mainListData = data.d;
            var item = data.d;
            if (item != null && item != '' & item != undefined) {
                $('.dynamic-control').each(function () {
                    var listType = $(this).attr('listtype');
                    var reflisttype = $(this).attr('reflisttype');
                    var elementId = $(this).attr('id');
                    var elementType = $(this).attr('controlType');
                    if (listType == 'main' || reflisttype == 'main') {
                        setFieldValue(elementId, item, elementType, elementId);
                    }
                });
            }
            GetLocalApprovalMatrixData(listItemId, mainListName);
        },
        error: function (data) {
            console.log(data);
        }
    });
}

// function cancel() {
//     if (returnUrl == "")
//         returnUrl = location.pathname.substring(0, location.pathname.lastIndexOf("/"));
//     location.href = decodeURIComponent(returnUrl);
// }

// function setFieldValue(controlId, item, fieldType, fieldName) {
//     if (!fieldName || fieldName == "")
//         fieldName = controlId;

//     switch (fieldType) {
//         case "text":
//             $("#" + controlId).val(item[fieldName]).change();
//             break;
//         case "label":
//             $("#" + controlId).text(item[fieldName]);
//             break;
//         case "terms":
//             if (item[fieldName]) {
//                 $("#" + controlId).val(item[fieldName].TermGuid).change()
//             }
//             break;
//         case "combo":
//             $("#" + controlId).val(item[fieldName]).change();
//             break;
//         case "multitext":
//             $("#" + controlId).val(item[fieldName]).change();
//             break;
//         case "date":
//             var dt = "";
//             if (item[fieldName] && item[fieldName] != null) {
//                 dt = new Date(item[fieldName]).format("dd-MM-yyyy");
//                 $("#" + controlId).val(dt).change();
//             }
//             break;
//     }
// }

function SaveForm() {
    var formValid = false;
    buttonActionStatus = "NextApproval";
    formValid = true;
    if (formValid) {
        SaveFormData();
    } else {
        alert("Please fill requied fields");
    }
}

// function SaveLocalApprovalMatrix() {
//     var approvers = [];
//     var status;

//     for (var i = 0; i < globalApprovalMatrix.length - 1; i++) {

//         if (globalApprovalMatrix[i].FillByRole == "Creator") {
//             if (globalApprovalMatrix[i].Role == approverMaster[i].Role) {
//                 approvers = approverMaster[i].UserNameId.results[0];
//             }
//             if (globalApprovalMatrix[i].Role == "Creator") {
//                 status = "Approved";
//             }
//             else {
//                 status = "Not Assigned";
//             }
//             $.ajax({
//                 url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('ItemCodeApprovalMatrix')/items",
//                 type: "POST",
//                 data: JSON.stringify
//                     ({
//                         __metadata: {
//                             type: "SP.Data.ItemCodeApprovalMatrixListItem"
//                         },
//                         Title: globalApprovalMatrix[i].SectionName.results[0].Label,
//                         Levels: globalApprovalMatrix[i].Levels,
//                         Role: globalApprovalMatrix[i].Role,
//                         IsReminder: globalApprovalMatrix[i].IsReminder,
//                         IsEscalate: globalApprovalMatrix[i].IsEscalate,
//                         FillByRole: globalApprovalMatrix[i].FillByRole,
//                         Status: status,
//                         ApproverId: {
//                             results: [approvers]
//                         },
//                         //ApproveById: vm.getcurrentuser.Id,
//                         Days: globalApprovalMatrix[i].Days,
//                         FormName: globalApprovalMatrix[i].FormName.Label,
//                         SectionName: globalApprovalMatrix[i].SectionName.results[0].Label,
//                         ApplicationName: globalApprovalMatrix[i].ApplicationName.Label,
//                         RequestIDId: listData.ID
//                     }),
//                 headers:
//                 {
//                     "Accept": "application/json;odata=verbose",
//                     "Content-Type": "application/json;odata=verbose",
//                     "X-RequestDigest": $("#__REQUESTDIGEST").val()
//                 },
//                 //async: true,
//                 success: function (data) {
//                     console.log("Item Successfully Created");
//                 },
//                 error: function (data) {

//                     console.log(data);
//                 }
//             });

//         }
//     }
// }

//,IsHold,Comments,Title,Levels,Role,IsReminder,IsEscalate,DueDate,FillByRole,Status,ApproveBy,AssignDate,ApprovalDate,Division,SubDivision,IsAutoApproval,FormName,ApplicationName,IsOptional,RequestID
//function GetLocalApprovalMatrix() {
//    console.log(globalApprovalMatrix);
//    $.ajax({
//        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('WorkflowTestApprovalMatrix')/Items?$select=*,Approver/EMail,Approver/UserName&$expand=Approver&$filter=RequestID eq '" + 110 + "'&$orderby= Levels asc",
//        type: "GET",
//        async: false,
//        headers:
//        {
//            "Accept": "application/json;odata=verbose",
//            "Content-Type": "application/json;odata=verbose",
//            "X-RequestDigest": $("#__REQUESTDIGEST").val()
//        },
//        success: function (data) {
//            console.log(data);
//            var localApprovalMatrixData = data.d.results;
//            SetFormLevel(localApprovalMatrixData);
//        },
//        error: function (data) {
//            console.log(data);
//        }
//    });
//}

function SendBack() {
    buttonActionStatus = "SendBack";
    SaveFormData();
}

//function SetFormLevel(localApprovalMatrixData) {
//    var mainListData = listData;
//    var previousLevel = mainListData.FormLevel.split("|")[0];
//    var currentLevel = mainListData.FormLevel.split("|")[1];
//    var nextLevel = "";
//    var formLevel = "";
//    var nextApprover = "";
//    var nextApproverRole = "";
//    var userEmail = "";

//    localApprovalMatrixData.filter(function (i) {
//        //console.log(i);
//        if (i.Status == "Pending" && i.ApproverId.results[0] != "" && buttonActionStatus != "SendBack" &&
//            buttonActionStatus != "SendForward" && i.Levels > currentLevel) {
//            nextLevel = i.Levels;
//            if (nextApprover == "") {
//                nextApproverRole = i.Role;
//                nextApprover = i.ApproverId.results[0];
//                userEmail = i.Approver.results[0].EMail;
//            }
//            else {
//                if (!(nextApprover == localApprovalMatrixData[i].Approver)) {
//                    nextApproverRole = nextApproverRole.Trim(',') + "," + localApprovalMatrixData[i].Role;
//                    nextApprover = nextApprover.Trim(',') + "," + localApprovalMatrixData[i].Approver;
//                }
//            }

//        }

//        if (buttonActionStatus == "SendBack" && sendToLevel != "") {
//            nextLevel = sendToLevel;
//            if (i.Levels == nextLevel) {
//                if (nextApprover == "") {
//                    nextApproverRole = i.Role;
//                    nextApprover = i.ApproverId.results[0];
//                }
//                else {
//                    if (!(nextApprover == localApprovalMatrixData[i].Approver)) {
//                        nextApproverRole = nextApproverRole.Trim(',') + "," + localApprovalMatrixData[i].Role;
//                        nextApprover = nextApprover.Trim(',') + "," + localApprovalMatrixData[i].Approver;
//                    }
//                }
//            }

//        }
//        if (buttonActionStatus == "SendForward" && sendToLevel != "") {
//            nextLevel = sendToLevel;
//            if (i.Levels == nextLevel) {
//                if (nextApprover == "") {
//                    nextApproverRole = i.Role;
//                    nextApprover = i.ApproverId.results[0];
//                }
//                else {
//                    if (!(nextApprover == localApprovalMatrixData[i].Approver)) {
//                        nextApproverRole = nextApproverRole.Trim(',') + "," + localApprovalMatrixData[i].Role;
//                        nextApprover = nextApprover.Trim(',') + "," + localApprovalMatrixData[i].Approver;
//                    }
//                }
//            }

//        }
//    });

//    // for (var i = 0; i <= localApprovalMatrixData.length - 1; i++) {
//    //     if (!(localApprovalMatrixData[i].Approver != "" &&
//    //         localApprovalMatrixData[i].IsOptional == false &&
//    //         localApprovalMatrixData[i].Status != "Approved" &&
//    //         localApprovalMatrixData[i].Levels == currentLevel) &&
//    //         buttonActionStatus != "SendBack" &&
//    //         buttonActionStatus != "SendForward") {
//    //         if (localApprovalMatrixData[i].Levels > currentLevel && localApprovalMatrixData[i].Approver != "" && localApprovalMatrixData[i].Status != "Not Required") {

//    //             nextLevel = localApprovalMatrixData[i].Levels;

//    //             if(localApprovalMatrixData[i].Approver != null && localApprovalMatrixData[i].Approver != ""){

//    //                 if(nextApprover == null && nextApprover == ""){
//    //                     nextApproverRole = localApprovalMatrixData[i].Role;
//    //                     nextApprover = localApprovalMatrixData[i].Approver;
//    //                 }
//    //                 else{
//    //                     if(!(nextApprover == localApprovalMatrixData[i].Approver))
//    //                     {
//    //                         nextApproverRole = nextApproverRole.Trim(',') + "," + localApprovalMatrixData[i].Role;
//    //                         nextApprover = nextApprover.Trim(',') + "," + localApprovalMatrixData[i].Approver;
//    //                     }
//    //                 }

//    //             }
//    //             break;
//    //         }
//    //         else{
//    //             if(buttonActionStatus == "NextApproval" || buttonActionStatus == "Delegate"){

//    //             }
//    //         }
//    //     }


//    //   console.log(vm.GetGlobalApprovalMatrix[i].Levels);
//    //}

//    // if (buttonActionStatus == "SendBack" && SendToLevel != "") {
//    //     nextLevel = SendToLevel;
//    // }

//    // if (buttonActionStatus == "SendForward" && SendToLevel != "") {
//    //     nextLevel = SendToLevel;
//    // }

//    switch (buttonActionStatus) {
//        case buttonActionStatus = "SaveAsDraft":
//            nextLevel = currentLevel;
//            currentLevel = previousLevel;

//            break;

//        case buttonActionStatus = "SaveAndStatusUpdate":
//        case buttonActionStatus = "SaveAndStatusUpdateWithEmail":
//        case buttonActionStatus = "ConfirmSave":

//            break;

//        case buttonActionStatus = "Save":

//            break;

//        case buttonActionStatus = "Submit":
//            nextLevel = currentLevel;
//            currentLevel = previousLevel;
//            break;

//        case buttonActionStatus = "Hold":

//            break;
//        case buttonActionStatus = "Resume":

//            break;

//        case buttonActionStatus = "UpdateAndRepublish":
//            nextLevel = currentLevel;
//            currentLevel = previousLevel;

//            break;

//        case buttonActionStatus = "Reschedule":
//            nextLevel = currentLevel;
//            currentLevel = previousLevel;

//            break;

//        case buttonActionStatus = "ReadyToPublish":
//            nextLevel = currentLevel;
//            currentLevel = previousLevel;

//            break;

//        case buttonActionStatus = "Delegate":
//        case buttonActionStatus = "NextApproval":

//            if (nextApprover != "" && nextApprover != null) {

//                formLevel = currentLevel + "|" + nextLevel
//            }
//            else {
//                nextLevel = currentLevel;
//                formLevel = currentLevel + "|" + currentLevel;

//            }
//            break;

//        case buttonActionStatus = "BackToCreator":

//            formLevel = currentLevel + "|" + nextLevel;
//            break;

//        case buttonActionStatus = "Cancel":

//            nextLevel = currentLevel;
//            currentLevel = previousLevel;

//            break;

//        case buttonActionStatus = "Rejected":

//            nextLevel = currentLevel;
//            currentLevel = previousLevel;

//            break;

//        case buttonActionStatus = "Complete":

//            formLevel = currentLevel + "|" + currentLevel;
//            break;

//        case buttonActionStatus = "SendBack":

//            formLevel = currentLevel + "|" + nextLevel;
//            break;

//        case buttonActionStatus = "SendForward":

//            if (!string.IsNullOrEmpty(nextApprover)) {

//                formLevel = currentLevel + "|" + nextLevel;
//            }
//            else {

//                formLevel = currentLevel + "|" + currentLevel;
//            }
//            break;
//        default:
//            nextLevel = currentLevel;
//            currentLevel = previousLevel;
//            break;

//    }

//    $.ajax({
//        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('ItemCodeProProcess')/items(" + listData.ID + ")",
//        type: "MERGE",
//        data: JSON.stringify
//            ({
//                __metadata: {
//                    type: "SP.Data.ItemCodeProProcessListItem"
//                },
//                FormLevel: formLevel,
//                NextApproverId: {
//                    results: [nextApprover]
//                }
//            }),
//        headers:
//        {
//            "Accept": "application/json;odata=verbose",
//            "Content-Type": "application/json;odata=verbose",
//            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
//            "IF-MATCH": "*"
//        },
//        success: function (data) {
//            console.log("Item saved Successfully");
//        },
//        error: function (data) {
//            console.log(data);
//        }
//    });

//    //ISALluserViewer logic pending
//    localApprovalMatrixData.filter(function (i) {
//        if (i.Approver.results != undefined) {
//            if (i.Levels == nextLevel && (i.Status == "Pending" || i.Status == "Hold" || i.Status == "Resume")) {

//                SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
//                    //alert('test');
//                    var clientContext = new SP.ClientContext.get_current();
//                    var oList = clientContext.get_web().get_lists().getByTitle(listName);

//                    var oListItem = oList.getItemById(listData.ID);
//                    var oUser = clientContext.get_web().ensureUser(i.Approver.results[0].EMail);
//                    //this.oUser = clientContext.get_web().get_siteUsers().getByLoginName('DOMAIN\\alias');

//                    oListItem.breakRoleInheritance(false, true); // break role inheritance first!

//                    var roleDefBindingColl = SP.RoleDefinitionBindingCollection.newObject(clientContext);
//                    roleDefBindingColl.add(clientContext.get_web().get_roleDefinitions().getByType(SP.RoleType.contributor));
//                    oListItem.get_roleAssignments().add(oUser, roleDefBindingColl);

//                    clientContext.load(oUser);
//                    clientContext.load(oListItem);

//                    clientContext.executeQueryAsync(Function.createDelegate(this, this.onQuerySucceeded), Function.createDelegate(this, this.onQueryFailed));
//                });
//            }

//            else if (i.Status != "Pending") {

//                SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
//                    //alert('test');
//                    var clientContext = new SP.ClientContext.get_current();
//                    var oList = clientContext.get_web().get_lists().getByTitle(listName);

//                    var oListItem = oList.getItemById(listData.ID);
//                    var oUser = clientContext.get_web().ensureUser(i.Approver.results[0].EMail);
//                    //this.oUser = clientContext.get_web().get_siteUsers().getByLoginName('DOMAIN\\alias');

//                    oListItem.breakRoleInheritance(false, true); // break role inheritance first!

//                    var roleDefBindingColl = SP.RoleDefinitionBindingCollection.newObject(clientContext);
//                    roleDefBindingColl.add(clientContext.get_web().get_roleDefinitions().getByType(SP.RoleType.reader));
//                    oListItem.get_roleAssignments().add(oUser, roleDefBindingColl);

//                    clientContext.load(oUser);
//                    clientContext.load(oListItem);

//                    clientContext.executeQueryAsync(Function.createDelegate(this, this.onQuerySucceeded), Function.createDelegate(this, this.onQueryFailed));
//                });
//            }
//        }

//    });
//}
//function onQuerySucceeded(sender, args) {
//    console.log("Success");
//}

//function onQueryFailed(sender, args) {
//    console.log('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
//}

// function GetButtons() {

//     GetFormDigest().then(function (data) {
//         $.ajax({
//             url: "https://bajajelect.sharepoint.com/sites/WFRootDev" + "/_api/web/lists/getbytitle('Buttons')/GetItems(query=@v1)?@v1={\"ViewXml\":\"<View><Query><Where><Eq><FieldRef Name='ApplicationName' /><Value Type='TaxonomyFieldType'>Item Code Creation Preprocess</Value></Eq></Where></Query></View>\"}",
//             type: "POST",
//             headers:
//             {
//                 "Accept": "application/json;odata=verbose",
//                 "Content-Type": "application/json; odata=verbose",
//                 "X-RequestDigest": data.d.GetContextWebInformation.FormDigestValue
//                 //"X-RequestDigest": $("#__REQUESTDIGEST").val(),  
//             },
//             success: function (data) {
//                 allButtons = data.d.results;
//                 GetButtonsByRole();
//             },
//             error: function (data) {
//                 console.log(data.responseJSON.error);
//             }
//         });
//     });
// }

// function GetButtonsByRole() {
//     if(listItemId > 0 && listItemId != null)
//     {
//         formStatus = mainListData.Status
//     }
//     else{
//         formStatus = "New";
//     }
//     var a = 0;
//     for (i = 0; i <= allButtons.length - 1; i++) {
//         if (allButtons[i].FormName.results[0].Label == formName && allButtons[i].Role.includes(currentUserRole) && allButtons[i].FormStatus.includes(formStatus)) {
//             currentRoleButtons[a] = allButtons[i];
//             a++;
//         }
//     }

//     var btnli = "";
//     var buttonCount = 1;

//     for (i = 0; i <= currentRoleButtons.length - 1; i++) {
//         var jsFuncName = Object.keys(jsFunctionValue).find(k => jsFunctionValue[k] === currentRoleButtons[i].JsFunctionNameId);
//         var jsFunc = "onClick=" + jsFuncName + "(this);";

//         var status = Object.keys(buttonActionStatus).find(k => buttonActionStatus[k] === currentRoleButtons[i].ButtonActionValueId);
//         var isVisible = currentRoleButtons[i].IsVisible ? "" : "class=hide";
//         btnli = btnli + '<li class="pull-left"><a id="btn' + (buttonCount++) + '" ' + isVisible + ' onClick="' + jsFuncName + '(this);"' + ' data-action="' + status + '" data-sendbackto="' + currentRoleButtons[i].SendBackTo + '" data-sendtorole="' + currentRoleButtons[i].SendToRole + '" class="btn btn-default" title="' + currentRoleButtons[i].ToolTip + '" data-placement="bottom"><i class="' + currentRoleButtons[i].Icon + '"></i>&nbsp;' + currentRoleButtons[i].Title + '</a></li>'
//     }

//     btnli = btnli + '<li class="pull-left"><a id="btnExit" class="btn btn-default" onclick="Exit(this);" title="Exit without saving any data"  data-placement="bottom"><i class="fa fa-sign-out"></i>&nbsp;Home</a></li>';

//     $('#dynamicli').html(btnli);
// }