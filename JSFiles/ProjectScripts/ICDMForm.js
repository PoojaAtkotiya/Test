var listName = ItemCodeProProcessListName;
var appName = applicationName;
var formName = "Item Code Preprocess Form";
var masterDataArray;

var listItemId;
var formData = {};
var mainListData = {};
var sendToLevel = 0;
var collListItem = null;
var currentContext;
var hostweburl;

$(document).ready(function () {
    hostweburl = "https://bajajelect.sharepoint.com/sites/MTDEV";

    var scriptbase = hostweburl + "/_layouts/15/";

    // Load the js files and continue to
    // the execOperation function.
    $.getScript(scriptbase + "SP.Runtime.js",
        function () {
            $.getScript(scriptbase + "SP.js", loadConstants);
        }
    );
});


function loadConstants() {
    var clientContext = new SP.ClientContext("https://bajajelect.sharepoint.com/sites/MTDEV");
    this.oWebsite = clientContext.get_web();
    clientContext.load(this.oWebsite);
    clientContext.executeQueryAsync(
        Function.createDelegate(this, onSuccess),
        Function.createDelegate(this, onFail)
    );
}

function onSuccess(sender, args) {

    currentContext = SP.ClientContext.get_current();
    listItemId = getUrlParameter("ID");
    returnUrl = getUrlParameter("Source");
    ExecuteOrDelayUntilScriptLoaded(GetCurrentUserDetails, "sp.js");

    ////Get Current user details
    // GetCurrentUserDetails();

    GetAllMasterData();

    // GetUserName(roleName, html element Id)
    GetUsersForDDL("LUM Marketing Delegate", "LUMMarketingDelegateId");
    GetUsersForDDL("LUM Design Delegate", "SCMLUMDesignDelegateId");


    //For Temporary
    //GetApproverMaster();

    if (listItemId != null && listItemId > 0) {
        GetSetFormData();
    }
    else {
        GetGlobalApprovalMatrix(listItemId);
    }
}

function onFail(sender, args) {
    console.log(args.get_message());
}

function GetUsersForDDL(roleName, eleID) {
    //sync call to avoid conflicts in deriving role wise users
    jQuery.ajax({
        async: false,
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('ApproverMaster')/items?$select=Role,UserSelection,UserName/Id,UserName/Title&$expand=UserName/Id&$expand=UserName/Id&$filter= (Role eq '" + roleName + "') and (UserSelection eq 1)",
        type: "GET",
        headers: { "Accept": "application/json;odata=verbose" },
        success: function (data, textStatus, xhr) {
            var dataResults = data.d.results;
            var allUsers = [];
            if (!IsNullOrUndefined(dataResults) && dataResults.length != -1) {
                $.each(dataResults, function (index, item) {
                    dataResults.forEach(users => {
                        if (!IsNullOrUndefined(users.UserName) && !IsNullOrUndefined(users.UserName.results) && users.UserName.results.length > 0) {
                            users.UserName.results.forEach(user => {
                                allUsers.push({ userId: user.Id, userName: user.Title })
                            });
                        }
                    });

                });
            }
            setUsersInDDL(allUsers, eleID);
        },
        error: function (error, textStatus) {
            console.log(error);
        }
    });
}

// function GetUserName(roleName, eleID) {
//     var oList = currentContext.get_web().get_lists().getByTitle('ApproverMaster');
//     var camlQuery = new SP.CamlQuery();
//     camlQuery.set_viewXml(
//         '<View><Query><Where><Eq><FieldRef Name=\'Role\'/>' +
//         '<Value Type=\'Text\'>' + roleName + '</Value></Eq></Where></Query>' +
//         '<RowLimit>5000</RowLimit></View>'
//     );
//     collListItem = oList.getItems(camlQuery);
//     currentContext.load(collListItem);
//     currentContext.executeQueryAsync(
//         Function.createDelegate(this, function (sender, args) {
//             onGetUserNameSucceeded(sender, args, eleID, collListItem)
//         }
//         ),
//         Function.createDelegate(this, onGetUserFailed)
//     );
// }

// function onGetUserNameSucceeded(sender, args, eleID, collListItem) {
//     var allUsers = [];
//     if (!IsNullOrUndefined(collListItem)) {
//         var listItemEnumerator = collListItem.getEnumerator();
//         while (listItemEnumerator.moveNext()) {
//             var oListItem = listItemEnumerator.get_current();
//             var users = oListItem.get_item('UserName');
//             if (!IsNullOrUndefined(users) && users.length != -1) {
//                 users.forEach(user => {
//                     allUsers.push({ userId: user.get_lookupId(), userName: user.get_lookupValue(), userEmail: user.get_email() })
//                 });
//             }

//         }
//         setUsersInDDL(allUsers, eleID);
//     }
// }

function onGetUserFailed(sender, args) {
    console.log('onGetUserFailed : Request failed. ' + args.get_message() +
        '\n' + args.get_stackTrace());
}
function setUsersInDDL(allUsers, eleID) {
    $("#" + eleID).html('');
    $("#" + eleID).html("<option value=''>Select</option>");
    if (!IsNullOrUndefined(allUsers) && allUsers.length > 0) {
        allUsers.forEach(user => {
            var opt = $("<option/>");
            opt.text(user.userName);
            opt.attr("value", user.userId);
            opt.appendTo($("#" + eleID));
        });
    }
}



function SaveFormData() {
    var mainListName = $('#divItemCodeForm').attr('mainlistname');
    if (mainListName != undefined && mainListName != '' && mainListName != null) {
        $('#divItemCodeForm').find('div[section]').not(".disabled").each(function (i, e) {
            var sectionName = $(e).attr('section');
            var listDataArray = {};
            $(e).find('input[listtype=main],select[listtype=main],radio[listtype=main],textarea[listtype=main],label[listtype=main],input[reflisttype=main],select[reflisttype=main],radio[reflisttype=main],textarea[reflisttype=main],label[reflisttype=main]').each(function () {
                var elementId = $(this).attr('id');
                var elementType = $(this).attr('controlType');
                listDataArray = GetFormControlsValue(elementId, elementType, listDataArray);
            });
            //if (ValidateFormControls('LUMMARKETINGINCHARGESECTION', false)) {
            SaveData(mainListName, listDataArray, sectionName);
            //}
        });
    }
}

function SaveData(listname, listDataArray, sectionName) {
    var itemType = GetItemTypeForListName(listname);

    //check if there any delegate user fillby section owner
    // $('#'+ sectionName).
    if (!IsNullOrUndefined(listDataArray.SCMLUMDesignDelegateId)) {
        var array = [];
        array.push(listDataArray.SCMLUMDesignDelegateId);
        listDataArray["SCMLUMDesignDelegateId"] = {"results" : array};
    }

    var isNewItem = true;
    if (listDataArray != null) {
        listDataArray["__metadata"] = {
            "type": itemType
        };
        var url = '', headers = '';
        if (listItemId != null && listItemId > 0 && listItemId != "") {

            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + listname + "')/items(" + listItemId + ")";
            headers = { "Accept": "application/json;odata=verbose", "Content-Type": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val(), "IF-MATCH": "*", "X-HTTP-Method": "MERGE" };
            isNewItem = false;
        }
        else {
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items";
            headers = { "Accept": "application/json;odata=verbose", "Content-Type": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val() };
        }
        $.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify(listDataArray),
            headers: headers,
            success: function (data) {
                var itemID = listItemId;
                if (!IsNullOrUndefined(data) && !IsNullOrUndefined(data.d)) {
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

                        ///Pending -- temporary
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
                debugger;
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