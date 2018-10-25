var listName = "ItemCodeProProcess";
var returnUrl = "";
var listItemId;
var itemAdded="";
var title = "";
var tranlistNameArray = [];
var masterlistNameArray = [];
var formData = {};
var tranListData = {};
var mainListData = {};
var localApprovalMatrix;
var currentUser;
var activeSectionName = "";
$(document).ready(function () {
    listItemId = getUrlParameter("ID");
    returnUrl = getUrlParameter("Source");

    ////Get Current user details
    GetCurrentUserDetails();

    GetAllMasterData();

    if (listItemId != null && listItemId > 0) {
        GetSetFormData();
    }
    else {
        activeSectionName = "LUMMARKETINGINCHARGESECTION";
        $("#" + activeSectionName).removeClass("disabled");
        $("div .disabled .form-control").attr("disabled", "disabled");
    }
    //  BindDatePicker('');
});

function GetCurrentUserDetails() {
    var url = "https://bajajelect.sharepoint.com/sites/MTDEV/_api/web/currentuser";
    $.ajax({
        url: url,
        headers: {
            Accept: "application/json;odata=verbose"
        },
        async: false,
        success: function (data) {
            currentUser = data.d; // Data will have user object      
        },
        eror: function (data) {
            alert("An error occurred. Please try again.");
        }
    });
}

function BindDatePicker(selector) {
    if ($.trim(selector) != "") {
        selector += selector + " ";
    }
    var todayDate = new Date();
    $(selector + '.datepicker').each(function () {
        var tempValue = $(this).find("input:first").val();
        $(this).datetimepicker({
            format: 'L', //for Date+++
            widgetParent: $(this).parent().is("td") ? "body" : null,
            minDate: $(this).hasClass("pastDisabled") ? new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 00, 00, 00) : undefined
        }).on("dp.change", function () {
            $(this).find("input").change();
        });
        $(this).find("input:first").val(tempValue);
    });
    $(selector + '.timepicker').each(function () {
        var tempValue = $(this).find("input:first").val();
        $(this).datetimepicker({
            format: 'LT' //for Date+++
            , widgetParent: $(this).parent().is("td") ? "body" : null
        }).on("dp.change", function () {
            $(this).find("input").change();
        });
        $(this).find("input:first").val(tempValue);
    });
}

function fillUserDetails() {
    var context = new SP.ClientContext.get_current();
    var web = context.get_web();
    var currentUser = web.get_currentUser();
    context.load(currentUser);
    var userGroups = currentUser.get_groups();
    context.load(userGroups);
    context.executeQueryAsync(function () {
        var groupsEnumerator = userGroups.getEnumerator();

        // while (groupsEnumerator.moveNext()) {
        // 	var group = groupsEnumerator.get_current();
        // 	if (group.get_title() == "Dispatch Request Approvers") {
        // 		isAutoApproved = true;
        // 		break;
        // 	}
        // }
    },
        function (sender, args) {
            console.log(args);
        });
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function GetAllMasterData() {
    $('input[listtype*=master],select[listtype*=master]').each(function () {
        var listType = $(this).attr('listtype');
        var listname = $(this).attr('listname');
        if (masterlistNameArray.indexOf(listname) < 0) {
            masterlistNameArray.push(listname);
        }

    });
    if (masterlistNameArray != null && masterlistNameArray.length > 0) {
        $(masterlistNameArray).each(function (i, e) {
            GetMasterData(masterlistNameArray[i]);
        });
    }
}

function GetMasterData(masterlistname) {
    if (masterlistname != undefined && masterlistname != '' && masterlistname != null) {
        $.ajax
            ({
                url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + masterlistname + "')/items",
                type: "GET",
                async: false,
                headers:
                    {
                        "Accept": "application/json;odata=verbose",
                        "Content-Type": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val()
                    },
                success: function (data) {
                    if (data != null && data != undefined && data.d != null && data.d.results != null) {
                        var result = data.d.results;
                        $('input[listname*=' + masterlistname + '],select[listname*=' + masterlistname + ']').each(function () {
                            var elementId = $(this).attr('id');
                            var elementType = $(this).attr('controlType');
                            var valueBindingColumn = $(this).attr('valuebindingcolumn');
                            var textBindingColumnn = $(this).attr('textbindingcolumnn');
                            switch (elementType) {
                                case "combo":
                                    $("#" + elementId).html('');
                                    $("#" + elementId).html("<option value=''>Select</option>");

                                    if (valueBindingColumn != '' && textBindingColumnn != '' && valueBindingColumn != undefined && textBindingColumnn != undefined) {
                                        $(result).each(function (i, e) {
                                            var cmditem = result[i];
                                            var opt = $("<option/>");
                                            opt.text(cmditem[textBindingColumnn]);
                                            opt.attr("value", cmditem[valueBindingColumn]);
                                            opt.appendTo($("#" + elementId));
                                        });
                                    }
                                    break;
                                case "listbox":
                                    break;
                            }
                        });
                    }

                },
                error: function (data) {
                    console.log($("#" + elementId).html(data.responseJSON.error));
                }
            });
    }
    else {
        console.log("Master List Name is undefined.");
    }
}

function SaveTranListData(lookupId) {
    TranListData(lookupId);
    tranListData = {};
    if (tranlistNameArray != null && tranlistNameArray.length > 0) {
        $(tranlistNameArray).each(function (i, e) {
            SetTranDataValues(tranlistNameArray[i], lookupId);
        });
    }
}

function SetTranDataValues(tranlistname, lookupId) {
    if (tranlistname != undefined && tranlistname != '' && tranlistname != null) {
        $('input[listname*=' + tranlistname + '],select[listname*=' + tranlistname + '],radio[listname*=' + tranlistname + '],textarea[listname*=' + tranlistname + ']').each(function () {
            var elementId = $(this).attr('id');
            var elementType = $(this).attr('controlType');
            tranListData = GetFormControlsValue(elementId, elementType, tranListData);
        });
        SaveTranData(tranlistname, tranListData, lookupId);
    }
}

function SaveTranData(listname, tranListDataArray, lookupId) {
    var itemType = GetItemTypeForListName(listname);
    if (tranListDataArray != null) {
        tranListDataArray["__metadata"] = {
            "type": itemType
        };

        if (listname != undefined && listname != '' && listname != null) {
            $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items?$select=Author/Title,*&$expand=Author&$filter=RequestID eq '" + lookupId + "'",
                type: "GET",
                async: false,
                headers:
                    {
                        "Accept": "application/json;odata=verbose",
                        "Content-Type": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val()
                    },
                success: function (data) {
                    var item = data.d.results[0];
                    if (item != null && item != '' & item != undefined) {
                        tranListDataArray.ID = item.ID;
                    }
                    //   cancel();
                }
            });
        }

        //  tranListDataArray.ID = IsTranDataExists(listname, lookupId);

        var url = '', headers = '';
        if (tranListDataArray.ID == null || tranListDataArray.ID == '' || tranListDataArray.ID == undefined) {
            tranListDataArray.ID = 0;
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items";
            headers = { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val() };
        }
        else {
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items(" + tranListDataArray.ID + ")";
            headers = { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val(), "IF-MATCH": "*", "X-HTTP-Method": "MERGE" };
        }
        tranListDataArray.RequestIDId = parseInt(lookupId);
        console.log(tranListDataArray);

        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(tranListDataArray),
            headers: headers,
            success: function (data) {
                alert("Data saved successfully.");
            },
            error: function (data) {
                console.log(data);
            }
        });
    }
}

function GetFormControlsValue(id, elementType, listDataArray) {
    var obj = '#' + id;
    switch (elementType) {
        case "text":
            listDataArray[id] = $(obj).val();
            break;
        case "terms":
            var metaObject = {
                __metadata: { "type": "SP.Taxonomy.TaxonomyFieldValue" },
                Label: $("select#" + id + ">option:selected").text(),
                TermGuid: $(obj).val(),
                WssId: -1
            }
            listDataArray[id] = metaObject;
            break;
        case "combo":
            listDataArray[id] = $(obj).val();
            break;
        case "multitext":
            listDataArray[id] = $(obj).val();
            break;
        case "date":
            listDataArray[id] = $(obj).val();
            break;
        case "checkbox":
            listDataArray[id] = $(obj)[0]['checked'];
            break;
        case "multicheckbox":
            var parenType = $(obj).attr('cParent');
            if (listDataArray[parenType] == undefined)
                listDataArray[parenType] = { "__metadata": { "type": "Collection(Edm.String)" }, "results": [] };

            var isChecked = $(obj)[0]['checked'];
            var choiceName = $(obj)[0].id;
            var idx = listDataArray[parenType].results.indexOf(choiceName);
            if (isChecked && idx == -1)
                listDataArray[parenType].results.push(choiceName);
            else if (idx > -1)
                listDataArray[parenType].results.splice(idx, 1);
            break;
        case "radiogroup":
            var parenType = $(obj).attr('cParent');
            listDataArray[parenType] = $(obj)[0].id;
            break;
    }
    return listDataArray;
}

function SaveFormData() {
    var mainListName = $('#divItemCodeForm').attr('mainlistname');
    if (mainListName != undefined && mainListName != '' && mainListName != null) {
     
        $('#divItemCodeForm').find('div[section]').not(".disabled").each(function (i, e) {
            $(e).find('input[listtype=main],select[listtype=main],radio[listtype=main],textarea[listtype=main],label[listtype=main],input[reflisttype=main],select[reflisttype=main],radio[reflisttype=main],textarea[reflisttype=main],label[reflisttype=main]').each(function () {
                var elementId = $(this).attr('id');
                var elementType = $(this).attr('controlType');
                mainListData = GetFormControlsValue(elementId, elementType, mainListData);
            });
            SaveData(mainListName, mainListData);
        });
    }
}

function SaveData(listname, listDataArray) {
    var itemType = GetItemTypeForListName(listname);
    if (listDataArray != null) {
        listDataArray["__metadata"] = {
            "type": itemType
        };
        console.log(listDataArray);
        var url = '', headers = '';
        if (listItemId != null && listItemId > 0 && listItemId != "") {
            listDataArray.ID = listItemId;
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listName + "')/items(" + listItemId + ")";
            headers = { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val(), "IF-MATCH": "*", "X-HTTP-Method": "MERGE" };
        }
        else {
            url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listName + "')/items";
            headers = { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val() };
        }

        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(listDataArray),
            headers: headers,
            success: function (data) {
                if (data != undefined && data != null && data.d != null) {
                    SaveTranListData(data.d.ID);
                }
                else {
                    SaveTranListData(listItemId);
                }
            },
            error: function (data) {
                console.log(data);
            }
        });
    }
}

function TranListData(lookupId) {
    tranlistNameArray = [];
    $('input[listtype*=tran],select[listtype*=tran],radio[listtype*=tran],textarea[listtype*=tran]').each(function () {
        var listType = $(this).attr('listtype');
        var listname = $(this).attr('listname');
        if (tranlistNameArray.indexOf(listname) < 0) {
            tranlistNameArray.push(listname);
        }
    });

}

function GetTranListData(lookupId) {
    TranListData(lookupId);
    if (tranlistNameArray != null && tranlistNameArray.length > 0) {
        $(tranlistNameArray).each(function (i, e) {
            GetTranData(tranlistNameArray[i], lookupId);
        });
    }
}

function IsTranDataExists(tranlistname, lookupId) {

}

function GetTranData(tranlistname, lookupId) {
    if (tranlistname != undefined && tranlistname != '' && tranlistname != null) {
        $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + tranlistname + "')/items?$select=Author/Title,*&$expand=Author&$filter=RequestID eq '" + lookupId + "'",
            type: "GET",
            async: false,
            headers:
                {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                },
            success: function (data) {
                var item = data.d.results[0];
                if (item != null && item != '' & item != undefined) {
                    $('input[listname*=' + tranlistname + '],select[listname*=' + tranlistname + '],radio[listname*=' + tranlistname + '],textarea[listname*=' + tranlistname + ']').each(function () {
                        var elementId = $(this).attr('id');
                        var elementType = $(this).attr('controlType');

                        setFieldValue(elementId, item, elementType, elementId);
                    });
                }
                if (tranlistname == "ItemCodeApprovalMatrix") {
                    localApprovalMatrix = data;
                    if (listItemId > 0 && localApprovalMatrix != null && localApprovalMatrix != undefined && localApprovalMatrix.d.results.length > 0) {
                        localApprovalMatrix.d.results.filter(function (i) {
                            if (i.Status == "Pending" && i.ApproverId.results.indexOf(this.currentUser.Id) >= 0) {
                                activeSectionName = i.SectionName;
                                activeSectionName = activeSectionName.replace(/ /g, '').trim().toUpperCase();
                                $("#" + activeSectionName).removeClass("disabled");
                                $("div .disabled .form-control").attr("disabled", "disabled");
                            }
                        });
                    }
                }
            }

        });


    }
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
        },
        error: function (data) {
            console.log(data);
        }
    });
}

function cancel() {
    if (returnUrl == "")
        returnUrl = location.pathname.substring(0, location.pathname.lastIndexOf("/"));
    location.href = decodeURIComponent(returnUrl);
}

function setFieldValue(controlId, item, fieldType, fieldName) {
    if (!fieldName || fieldName == "")
        fieldName = controlId;

    switch (fieldType) {
        case "text":
            $("#" + controlId).val(item[fieldName]).change();
            break;
        case "label":
            $("#" + controlId).text(item[fieldName]);
            break;
        case "terms":
            if (item[fieldName]) {
                $("#" + controlId).val(item[fieldName].TermGuid).change()
            }
            break;
        case "combo":
            $("#" + controlId).val(item[fieldName]).change();
            break;
        case "multitext":
            $("#" + controlId).val(item[fieldName]).change();
            break;
        case "date":
            var dt = "";
            if (item[fieldName] && item[fieldName] != null) {
                dt = new Date(item[fieldName]).format("dd-MM-yyyy");
                $("#" + controlId).val(dt).change();
            }
            break;
    }
}

function SaveForm() {
    var formValid = false;
    formValid = true;
    if (formValid) {
        SaveFormData();
    } else {
        alert("Please fill requied fields");
    }
}

function GetItemTypeForListName(name) {
    return "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1) + "ListItem";
}
