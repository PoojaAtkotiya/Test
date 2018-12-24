var listName = ItemCodeProProcessListName;
var appName = applicationName;
var formName = "Item Code Preprocess Form";
var masterDataArray;

var listItemId;
var formData = {};
var mainListData = {};
var listData = [];

var sendToLevel = 0;
var collListItem = null;

$(document).ready(function () {
    listItemId = getUrlParameter("ID");
    returnUrl = getUrlParameter("Source");

    ////Get Current user details
    GetCurrentUserDetails();

    GetAllMasterData();
    //For Temporary
    GetApproverMaster();

    //Get username in LUM Delegate Dropdown
    GetUserName();

    if (listItemId != null && listItemId > 0) {
        GetSetFormData();
    }
    else {
        GetGlobalApprovalMatrix(listItemId);
    }
});

function GetUserName() {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        var clientContext = new SP.ClientContext.get_current();
        var oList = clientContext.get_web().get_lists().getByTitle('ApproverMaster');
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml(
            '<View><Query><Where><Eq><FieldRef Name=\'Role\'/>' +
            '<Value Type=\'Text\'>' + "LUM Marketing Delegate" + '</Value></Eq></Where></Query>' +
            '<RowLimit>5000</RowLimit></View>'
        );
        collListItem = oList.getItems(camlQuery);
        clientContext.load(collListItem);
        clientContext.executeQueryAsync(
            Function.createDelegate(this, onQuerySucceeded),
            Function.createDelegate(this, onQueryFailed)
        );
    });
}

function onQuerySucceeded(sender, args) {

    var listItemInfo = '';
    var allUsers = [];
    if (!IsNullOrUndefined(collListItem)) {
        var listItemEnumerator = collListItem.getEnumerator();
        while (listItemEnumerator.moveNext()) {
            var oListItem = listItemEnumerator.get_current();
            debugger
            var users = oListItem.get_item('UserName');
            if(!IsNullOrUndefined(users) && users.length != -1 ){
                users.forEach(user => {
                    allUsers.push({userId :user.get_lookupId(), userName : user.get_lookupValue() ,userEmail : user.get_email() })
                });
            }

        }
        if(!IsNullOrUndefined(allUsers) && allUsers.length >0 ){
            allUsers.forEach(element => {
                
            });
        }
    }
}

function onQueryFailed(sender, args) {
    alert('Request failed. ' + args.get_message() +
        '\n' + args.get_stackTrace());
}

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
            //if (ValidateFormControls('LUMMARKETINGINCHARGESECTION', false)) {
            SaveData(mainListName, mainListData, sectionName);
            //}
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

                        ///Pending
                        var param = [
                            SendToLevel = 0
                        ]

                        SaveLocalApprovalMatrix(sectionName, itemID, listname, isNewItem, oListItem, ItemCodeApprovalMatrixListName, param);

                        if (data != undefined && data != null && data.d != null) {
                            SaveTranListData(itemID);
                        }
                        else {
                            SaveTranListData(itemID);
                        }
                        alert("Data saved successfully");

                    }, function (sender, args) {
                        console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
                    });
                });


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


function SendBack() {
    buttonActionStatus = "SendBack";
    SaveFormData();
}

function setCustomApprovers(tempApproverMatrix) {
    if (!IsNullOrUndefined(tempApproverMatrix) && tempApproverMatrix.length != -1) {
        var smsIncharge = null;
        var smsDelegate = null;
        tempApproverMatrix.filter(function (temp) {
            if (temp.Role == "SMS Incharge" && !IsNullOrUndefined(temp.ApproverId)) {
                smsIncharge = temp.ApproverId;
            }
            else if (temp.Role == "SMS Delegate" && !IsNullOrUndefined(temp.ApproverId)) {
                smsDelegate = temp.ApproverId;
            }
        });
        if (smsIncharge != null) {
            tempApproverMatrix.filter(function (temp) {
                if (temp.Role == "Final SMS Incharge" && temp.Status != "Not Required") {
                    temp.ApproverId = smsIncharge;
                }
            });
        }
        if (smsDelegate != null) {
            tempApproverMatrix.filter(function (temp) {
                if (temp.Role == "Final SMS Delegate" && temp.Status != "Not Required") {
                    temp.ApproverId = smsDelegate;
                }
            });
        }
    }
}