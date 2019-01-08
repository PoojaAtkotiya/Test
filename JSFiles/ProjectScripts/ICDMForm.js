var listName = ItemCodeProProcessListName;
var appName = applicationName;
var formName = "Item Code Preprocess Form";
var masterDataArray;

// var listItemId;
var formData = {};
var mainListData = {};
var sendToLevel = 0;
var collListItem = null;
// var currentContext;
// var hostweburl;
var fileInfos = [];

$(document).ready(function () {
    // hostweburl = "https://bajajelect.sharepoint.com/sites/MTDEV";

    // var scriptbase = hostweburl + "/_layouts/15/";

    // // Load the js files and continue to
    // // the execOperation function.
    // $.getScript(scriptbase + "SP.Runtime.js",
    //     function () {
    //         $.getScript(scriptbase + "SP.js", loadConstants);
    //     }
    // );
    GetUsersForDDL("LUM Marketing Delegate", "LUMMarketingDelegateId");
    GetUsersForDDL("LUM Design Delegate", "SCMLUMDesignDelegateId");
});


// function loadConstants() {
//     var clientContext = new SP.ClientContext("https://bajajelect.sharepoint.com/sites/MTDEV");
//     this.oWebsite = clientContext.get_web();
//     clientContext.load(this.oWebsite);
//     clientContext.executeQueryAsync(
//         Function.createDelegate(this, onSuccess),
//         Function.createDelegate(this, onFail)
//     );
// }

// function onSuccess(sender, args) {

//     currentContext = SP.ClientContext.get_current();
//     listItemId = getUrlParameter("ID");
//     returnUrl = getUrlParameter("Source");
//     ExecuteOrDelayUntilScriptLoaded(GetCurrentUserDetails, "sp.js");

//     ////Get Current user details
//     // GetCurrentUserDetails();

//     GetAllMasterData();

//     // GetUserName(roleName, html element Id)
//     GetUsersForDDL("LUM Marketing Delegate", "LUMMarketingDelegateId");
//     GetUsersForDDL("LUM Design Delegate", "SCMLUMDesignDelegateId");


//     //For Temporary
//     //GetApproverMaster();

//     if (listItemId != null && listItemId > 0) {
//         GetSetFormData();
//     }
//     else {
//         GetGlobalApprovalMatrix(listItemId);
//     }
// }

// function onFail(sender, args) {
//     console.log(args.get_message());
// }




//Not in use -----------
// function onGetUserFailed(sender, args) {
//     console.log('onGetUserFailed : Request failed. ' + args.get_message() +
//         '\n' + args.get_stackTrace());
// }



function ICDM_SaveData(ele) {
    if (ValidateForm(ele)) {
        FormBusinessLogic();
        SaveForm();
    }
}

function FormBusinessLogic() {
  //check if there any delegate user fillby section owner
    // $('#'+ sectionName).

}


function SaveFormData() {
    var mainListName = $('#divItemCodeForm').attr('mainlistname');
    if (mainListName != undefined && mainListName != '' && mainListName != null) {
        $('#divItemCodeForm').find('div[section]').not(".disabled").each(function (i, e) {
            var sectionName = $(e).attr('section');
            var activeSectionId = $(e).attr('id');
            var listDataArray = {};
            $(e).find('input[listtype=main],select[listtype=main],radio[listtype=main],textarea[listtype=main],label[listtype=main],input[reflisttype=main],select[reflisttype=main],radio[reflisttype=main],textarea[reflisttype=main],label[reflisttype=main]').each(function () {
                var elementId = $(this).attr('id');
                var elementType = $(this).attr('controlType');
                listDataArray = GetFormControlsValue(elementId, elementType, listDataArray);
            });

            // if (ValidateFormControls(activeSectionId, false)) {
            SaveData(mainListName, listDataArray, sectionName);
            // }
        });
    }
}

function SaveData(listname, listDataArray, sectionName) {
    var itemType = GetItemTypeForListName(listname);

  
    ////Pending to make it dynamic
    if (!IsNullOrUndefined(listDataArray.SCMLUMDesignDelegateId)) {
        var array = [];
        array.push(listDataArray.SCMLUMDesignDelegateId);
        listDataArray["SCMLUMDesignDelegateId"] = { "results": array };
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
                debugger
                // AddAttachments(itemID);
                AddAllAttachments(listname,itemID);
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
                        ] +

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

function AddAllAttachments(listname,itemID) {
    $('#divItemCodeForm').find('div[section]').not(".disabled").each(function (i, e) {
        var fileListArray = [];
        $(e).find('input[type="file"]').each(function () {
            var elementId = $(this).attr('id');
            var controlType = $(this).attr('controlType');
            // if (controlType == "file") {
                debugger;
                fileListArray = GetAttachmentValue(elementId, fileListArray);
                //if (!IsNullOrUndefined(fileListArray)) {
                    SaveItemWiseAttachments(listname, fileListArray, itemID, elementId);
                //}
           // }

        });


    });
}

function GetAttachmentValue(elementId, fileListArray) {
    var input =document.getElementById("UploadArtworkAttachment")
    var fileCount = input.files.length;
    for (var i = 0; i < fileCount; i++) {
        var file = input.files[i];
        var reader = new FileReader();
        reader.onload = (function (file) {
            return function (e) {
                console.log(file.name);
                debugger;
                fileInfos.push({
                    "name": file.name,
                    "content": e.target.result
                });
            }
        })(file);
        reader.readAsArrayBuffer(file);
    }
}

function SaveItemWiseAttachments(listname, fileListArray, itemID, elementId) {
    var item = $pnp.sp.web.lists.getByTitle(listname).items.getById(itemID);
    item.attachmentFiles.addMultiple(fileInfos).then(v => {
        console.log(v);
        // pnp.sp.web.lists.getByTitle(listname).items.getById(itemID).update({
        //     elementId: "file name here",
        // }).then(result => {
        //     console.log(JSON.stringify(result));
        // }).catch(function (err) {
        //     debugger;
        //     console.log(err);
        //     console.log("error while saving file name in multiline text field");
        // });
        console.log("files saved successfully in list = " + listname + "for listItemId = " + itemID);
    }).catch(function (err) {       
        console.log(err);
        console.log("error while save attachment ib list = " + listname + "for listItemId = " + itemID)
    });
}

////requried if attachment using ajax call
// function AddAttachments(itemId) {
//     debugger
//     var fileInput = $('#UploadArtworkAttachment');
//     var fileName = fileInput[0].files[0].name;
//     var reader = new FileReader();
//     reader.onload = function (e) {
//         var fileData = e.target.result;
//         var res11 = $.ajax({
//             url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + ItemCodeProProcessListName + "')/items(" + itemId + ")/AttachmentFiles/ add(FileName='" + fileName + "')",
//             method: "POST",
//             binaryStringRequestBody: true,
//             data: fileData,
//             processData: false,
//             async: false,
//             headers: {
//                 "ACCEPT": "application/json;odata=verbose",
//                 "X-RequestDigest": _spPageContextInfo.formDigestValue,
//                 "content-length": fileData.byteLength
//             },
//             success: function (data) {
//                 console.log(data);
//                 console.log("attachment saved successfully. filename = " + fileName);
//             },
//             error: function (data) {
//                 debugger;
//                 console.log(data);
//             }
//         });
//     };
//     reader.readAsArrayBuffer(fileInput[0].files[0]);

// }

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
    //Object.keys(buttonActionStatus.NextApproval)
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