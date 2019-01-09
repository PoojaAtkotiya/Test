var listName = ItemCodeProProcessListName;
var appName = applicationName;
var formName = "Item Code Preprocess Form";
var masterDataArray;
var formData = {};
var mainListData = {};
var sendToLevel = 0;
var collListItem = null;
var fileInfos = [];

$(document).ready(function () {
    GetUsersForDDL("LUM Marketing Delegate", "LUMMarketingDelegateId");
    GetUsersForDDL("LUM Design Delegate", "SCMLUMDesignDelegateId");
});


function ICDM_SaveData(ele) {
    ValidateForm(ele, SaveDataCall);
}
function SaveDataCall(activeSection) {
    var isError = FormBusinessLogic();

    if (!isError) {
        SaveForm();
    }
}

function FormBusinessLogic() {
    var isError = false;
    try {
        //check if there any delegate user fillby section owner
        // $('#'+ sectionName).


        ////Pending to make it dynamic
        if (!IsNullOrUndefined(listDataArray.SCMLUMDesignDelegateId)) {
            var array = [];
            array.push(listDataArray.SCMLUMDesignDelegateId);
            listDataArray["SCMLUMDesignDelegateId"] = { "results": array };
        }
    }
    catch (Exception) {
        isError = true;
        console.log("Error occured in FormBusinessLogic" + Exception);
    }
    return isError;
}

function AddAllAttachments(listname, itemID) {
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
    var input = document.getElementById("UploadArtworkAttachment")
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

function SaveForm(dataAction) {
    try {
        var formValid = false;
        //Object.keys(buttonActionStatus.NextApproval)
        formValid = true;
        if (formValid) {
            SaveFormData();
        } else {
            alert("Please fill requied fields");
        }
    }
    catch (Exception) {
        console.log("Error occured in SaveForm" + Exception);
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