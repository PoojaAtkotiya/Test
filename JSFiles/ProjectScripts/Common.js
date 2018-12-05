var returnUrl = "";
var currentUser;
var approverMaster;
var securityToken;
jQuery(document).ready(function () {   
    KeyPressNumericValidation();   
});

function KeyPressNumericValidation() {
    jQuery('input[data="integer"]').keypress(function (event) {
        return Integer(this, event);
    }).bind('paste', function (e) {
        return false;
    });

    jQuery('input[data="digit"]').keypress(function (event) {
        return Digit(this, event);
    }).bind('paste', function (e) {
        return false;
    });

    jQuery('input[data="numeric"]').keypress(function (event) {
        return Numeric(this, event);
    }).bind('paste', function (e) {
        return false;
    });

    jQuery('input[data="PositiveNumeric"]').keypress(function (event) {
        return PositiveNumeric(this, event);
    }).bind('paste', function (e) {
        return false;
    });

    jQuery('input[data="AlphaNumeric"]').keypress(function (event) {
        return AlphaNumeric(this, event);
    }).bind('paste', function (e) {
        return false;
    });

    jQuery('input[data="Alphabet"]').keypress(function (event) {
        return Alphabet(this, event);
    }).bind('paste', function (e) {
        return true;
    });

    jQuery('input[data="AlphaNumericSpecial"]').keypress(function (event) {
        return AlphaNumericSpecial(this, event);
    }).bind('paste', function (e) {
        return true;
    });
}

function Digit(objTextbox, event) {
    var keyCode = (event.which) ? event.which : (window.event) ? window.event.keyCode : -1;
    if (keyCode >= 48 && keyCode <= 57) {
        return true;
    }
    if (keyCode == 8 || keyCode == -1) {
        return true;
    }
    else {
        return false;
    }
}

function Integer(objTextbox, event) {
    var keyCode = (event.which) ? event.which : (window.event) ? window.event.keyCode : -1;
    if (keyCode >= 48 && keyCode <= 57 || keyCode == 45) {
        if (keyCode == 45) {
            if (objTextbox.value.indexOf("-") == -1)
                return true;
            else
                return false;
        }
        else
            return true;
    }
    if (keyCode == 8 || keyCode == -1) {
        return true;
    }
    else {
        return false;
    }
}

function Numeric(objTextbox, event) {
    var keyCode = (event.which) ? event.which : (window.event) ? window.event.keyCode : -1;
    if (keyCode >= 48 && keyCode <= 57 || keyCode == 46 || keyCode == 45) {
        if (keyCode == 46) {
            if (objTextbox.value.indexOf(".") == -1)
                return true;
            else
                return false;
        }
        else if (keyCode == 45) {
            if (objTextbox.value.indexOf("-") == -1)
                return true;
            else
                return false;
        }
        else
            return true;
    }
    if (keyCode == 8 || keyCode == -1) {
        return true;
    }
    else {
        return false;
    }
}

function AlphaNumericSpecial(objTextbox, event) {
    if (event.charCode != 0) {
        var regex = new RegExp("[^']+");
        var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
        if (!regex.test(key)) {
            event.preventDefault();
            return false;
        }
    }
    var key = event.which || event.keyCode;
}

function AlphaNumeric(objTextbox, event) {

    if (event.charCode != 0) {
        var regex = new RegExp("^[a-zA-Z0-9]+$");
        var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
        if (!regex.test(key)) {
            event.preventDefault();
            return false;
        }
    }
    var key = event.which || event.keyCode;
}
function Alphabet(objTextbox, event) {

    if (event.charCode != 0) {
        var regex = new RegExp("^[a-zA-Z]+$");
        var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
        if (!regex.test(key)) {
            event.preventDefault();
            return false;
        }
    }
    var key = event.which || event.keyCode;
}

function PositiveNumeric(objTextbox, event) {
    var keyCode = (event.which) ? event.which : (window.event) ? window.event.keyCode : -1;
    if (keyCode >= 48 && keyCode <= 57 || keyCode == 46) {

        if (keyCode == 46) {
            if (objTextbox.value.indexOf(".") == -1)
                return true;
            else
                return false;
        }
        else
            return true;
    }
    if (keyCode == 8 || keyCode == -1) {
        return true;
    }
    else {
        return false;
    }
}

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

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function cancel() {
    if (returnUrl == "")
        returnUrl = location.pathname.substring(0, location.pathname.lastIndexOf("/"));
    location.href = decodeURIComponent(returnUrl);
}

function GetFormDigest() {
    return $.ajax({
        url: "https://bajajelect.sharepoint.com/sites/WFRootDev" + "/_api/contextinfo",
        method: "POST",
        headers: { "Accept": "application/json; odata=verbose" }
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

function GetItemTypeForListName(name) {
    return "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1) + "ListItem";
}

function SetFormLevel(requestId, mainListName, localApprovalMatrixData) {
    var web, clientContext;
    var previousLevel;
    var currentLevel;
    var nextLevel = "";
    var formLevel = "";
    var nextApprover = "";
    var nextApproverRole = "";
    var userEmail = "";
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        clientContext = new SP.ClientContext.get_current();
        web = clientContext.get_web();
        oList = web.get_lists().getByTitle(mainListName);
        var oListItem = oList.getItemById(requestId);

        clientContext.load(oListItem, 'FormLevel');
        clientContext.load(web);
        //clientContext.load(web, 'EffectiveBasePermissions');

        clientContext.executeQueryAsync(function () {
            previousLevel = oListItem.get_item('FormLevel').split("|")[0];
            currentLevel = oListItem.get_item('FormLevel').split("|")[1];
        }, function (sender, args) {
            console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
        });
    });

    localApprovalMatrixData.filter(function (i) {
        //console.log(i);
        if (i.Status == "Pending" && i.ApproverId.results[0] != "" && buttonActionStatus != "SendBack" &&
            buttonActionStatus != "SendForward" && i.Levels > currentLevel) {
            nextLevel = i.Levels;
            if (nextApprover == "") {
                nextApproverRole = i.Role;
                nextApprover = i.ApproverId.results[0];
                userEmail = i.Approver.results[0].EMail;
            }
            else {
                if (!(nextApprover == localApprovalMatrixData[i].Approver)) {
                    nextApproverRole = nextApproverRole.Trim(',') + "," + localApprovalMatrixData[i].Role;
                    nextApprover = nextApprover.Trim(',') + "," + localApprovalMatrixData[i].Approver;
                }
            }

        }

        if (buttonActionStatus == "SendBack" && sendToLevel != "") {
            nextLevel = sendToLevel;
            if (i.Levels == nextLevel) {
                if (nextApprover == "") {
                    nextApproverRole = i.Role;
                    nextApprover = i.ApproverId.results[0];
                }
                else {
                    if (!(nextApprover == localApprovalMatrixData[i].Approver)) {
                        nextApproverRole = nextApproverRole.Trim(',') + "," + localApprovalMatrixData[i].Role;
                        nextApprover = nextApprover.Trim(',') + "," + localApprovalMatrixData[i].Approver;
                    }
                }
            }

        }
        if (buttonActionStatus == "SendForward" && sendToLevel != "") {
            nextLevel = sendToLevel;
            if (i.Levels == nextLevel) {
                if (nextApprover == "") {
                    nextApproverRole = i.Role;
                    nextApprover = i.ApproverId.results[0];
                }
                else {
                    if (!(nextApprover == localApprovalMatrixData[i].Approver)) {
                        nextApproverRole = nextApproverRole.Trim(',') + "," + localApprovalMatrixData[i].Role;
                        nextApprover = nextApprover.Trim(',') + "," + localApprovalMatrixData[i].Approver;
                    }
                }
            }

        }
    });

    // for (var i = 0; i <= localApprovalMatrixData.length - 1; i++) {
    //     if (!(localApprovalMatrixData[i].Approver != "" &&
    //         localApprovalMatrixData[i].IsOptional == false &&
    //         localApprovalMatrixData[i].Status != "Approved" &&
    //         localApprovalMatrixData[i].Levels == currentLevel) &&
    //         buttonActionStatus != "SendBack" &&
    //         buttonActionStatus != "SendForward") {
    //         if (localApprovalMatrixData[i].Levels > currentLevel && localApprovalMatrixData[i].Approver != "" && localApprovalMatrixData[i].Status != "Not Required") {

    //             nextLevel = localApprovalMatrixData[i].Levels;

    //             if(localApprovalMatrixData[i].Approver != null && localApprovalMatrixData[i].Approver != ""){

    //                 if(nextApprover == null && nextApprover == ""){
    //                     nextApproverRole = localApprovalMatrixData[i].Role;
    //                     nextApprover = localApprovalMatrixData[i].Approver;
    //                 }
    //                 else{
    //                     if(!(nextApprover == localApprovalMatrixData[i].Approver))
    //                     {
    //                         nextApproverRole = nextApproverRole.Trim(',') + "," + localApprovalMatrixData[i].Role;
    //                         nextApprover = nextApprover.Trim(',') + "," + localApprovalMatrixData[i].Approver;
    //                     }
    //                 }

    //             }
    //             break;
    //         }
    //         else{
    //             if(buttonActionStatus == "NextApproval" || buttonActionStatus == "Delegate"){

    //             }
    //         }
    //     }


    //   console.log(vm.GetGlobalApprovalMatrix[i].Levels);
    //}

    // if (buttonActionStatus == "SendBack" && SendToLevel != "") {
    //     nextLevel = SendToLevel;
    // }

    // if (buttonActionStatus == "SendForward" && SendToLevel != "") {
    //     nextLevel = SendToLevel;
    // }

    switch (buttonActionStatus) {
        case buttonActionStatus = "SaveAsDraft":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
        case buttonActionStatus = "SaveAndStatusUpdate":
        case buttonActionStatus = "SaveAndStatusUpdateWithEmail":
        case buttonActionStatus = "ConfirmSave":
            break;
        case buttonActionStatus = "Save":
            break;
        case buttonActionStatus = "Submit":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
        case buttonActionStatus = "Hold":
            break;
        case buttonActionStatus = "Resume":
            break;
        case buttonActionStatus = "UpdateAndRepublish":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
        case buttonActionStatus = "Reschedule":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
        case buttonActionStatus = "ReadyToPublish":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
        case buttonActionStatus = "Delegate":
        case buttonActionStatus = "NextApproval":
            if (nextApprover != "" && nextApprover != null) {
                formLevel = currentLevel + "|" + nextLevel
            }
            else {
                nextLevel = currentLevel;
                formLevel = currentLevel + "|" + currentLevel;
            }
            break;
        case buttonActionStatus = "BackToCreator":
            formLevel = currentLevel + "|" + nextLevel;
            break;
        case buttonActionStatus = "Cancel":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
        case buttonActionStatus = "Rejected":
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
        case buttonActionStatus = "Complete":
            formLevel = currentLevel + "|" + currentLevel;
            break;
        case buttonActionStatus = "SendBack":
            formLevel = currentLevel + "|" + nextLevel;
            break;
        case buttonActionStatus = "SendForward":
            if (!string.IsNullOrEmpty(nextApprover)) {
                formLevel = currentLevel + "|" + nextLevel;
            }
            else {
                formLevel = currentLevel + "|" + currentLevel;
            }
            break;
        default:
            nextLevel = currentLevel;
            currentLevel = previousLevel;
            break;
    }

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + mainListName + "')/items(" + requestId + ")",
        type: "MERGE",
        data: JSON.stringify
            ({
                __metadata: {
                    type: GetItemTypeForListName(mainListName)
                },
                FormLevel: formLevel,
                NextApproverId: {
                    results: [nextApprover]
                }
            }),
        headers:
        {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "IF-MATCH": "*"
        },
        success: function (data) {
            console.log("Item saved Successfully");
        },
        error: function (data) {
            console.log(data);
        }
    });

    //ISALluserViewer logic pending
    localApprovalMatrixData.filter(function (i) {
        if (i.Approver.results != undefined) {
            if (i.Levels == nextLevel && (i.Status == "Pending" || i.Status == "Hold" || i.Status == "Resume")) {
                SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
                    var clientContext = new SP.ClientContext.get_current();
                    var oList = clientContext.get_web().get_lists().getByTitle(mainListName);

                    var oListItem = oList.getItemById(requestId);
                    var oUser = clientContext.get_web().ensureUser(i.Approver.results[0].EMail);
                    //this.oUser = clientContext.get_web().get_siteUsers().getByLoginName('DOMAIN\\alias');

                    oListItem.breakRoleInheritance(false, true); // break role inheritance first!

                    var roleDefBindingColl = SP.RoleDefinitionBindingCollection.newObject(clientContext);
                    roleDefBindingColl.add(clientContext.get_web().get_roleDefinitions().getByType(SP.RoleType.contributor));
                    oListItem.get_roleAssignments().add(oUser, roleDefBindingColl);

                    clientContext.load(oUser);
                    clientContext.load(oListItem);

                    clientContext.executeQueryAsync(Function.createDelegate(this, this.onQuerySucceeded), Function.createDelegate(this, this.onQueryFailed));
                });
            }

            else if (i.Status != "Pending") {

                SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
                    //alert('test');
                    var clientContext = new SP.ClientContext.get_current();
                    var oList = clientContext.get_web().get_lists().getByTitle(listName);

                    var oListItem = oList.getItemById(listData.ID);
                    var oUser = clientContext.get_web().ensureUser(i.Approver.results[0].EMail);
                    //this.oUser = clientContext.get_web().get_siteUsers().getByLoginName('DOMAIN\\alias');

                    oListItem.breakRoleInheritance(false, true); // break role inheritance first!

                    var roleDefBindingColl = SP.RoleDefinitionBindingCollection.newObject(clientContext);
                    roleDefBindingColl.add(clientContext.get_web().get_roleDefinitions().getByType(SP.RoleType.reader));
                    oListItem.get_roleAssignments().add(oUser, roleDefBindingColl);

                    clientContext.load(oUser);
                    clientContext.load(oListItem);

                    clientContext.executeQueryAsync(Function.createDelegate(this, this.onQuerySucceeded), Function.createDelegate(this, this.onQueryFailed));
                });
            }
        }

    });
}

function onQuerySucceeded(sender, args) {
    console.log("Success");
}

function onQueryFailed(sender, args) {
    console.log('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
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

function GetApproverMaster() {
    $.ajax
        ({
            url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + ApproverMasterListName + "')/items",
            type: "GET",
            async: false,
            headers:
            {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            success: function (data) {
                approverMaster = data.d.results;
            },
            error: function (data) {
                console.log(data.responseJSON.error);
            }
        });
}
//function ValidateCollapseForm() {
//    $(".card-body").each(function () {
//        if ($(this).hasClass("collapse")) {
//            var form = $(this).find("form");
//            if (form.length == 0) {
//                form = $(this).parents("form");
//            }
//            if (form.length > 0 && !form.hasClass("disabled")) {
//                $(this).removeClass("collapse");
//                $(this).addClass("in").css("height", "auto");
//            }
//        }
//    });
//}

//function SubmitNoRedirect(ele) {
//    ValidateCollapseForm();
//    var formList = $("form[data-ajax='true']:visible").not(".disabled");

//    var isValid = true;
//    var dataAction = $(ele).attr("data-action");
//    formList.each(function () {

//        if ($(this).find(".amount").length > 0) {
//            $(this).find(".amount").each(function (i, e) {
//                $(e).val($(e).val().replace(/,/g, ''));
//            });
//        }
//        if (dataAction == "1" || dataAction == "33") {
//            $(this).validate().settings.ignore = "*";
//        }
//        else if (dataAction == "22") {
//            $(this).validate().settings.ignore = "*";
//            $(".field-validation-error").addClass("field-validation-valid");
//            $(".field-validation-valid").removeClass("field-validation-error");
//            $(this).validate().settings.ignore = ":not(.requiredOnSendBack)";
//        }
//        else if (dataAction == "41") {
//            $(this).validate().settings.ignore = "*";
//            $(".field-validation-error").addClass("field-validation-valid");
//            $(".field-validation-valid").removeClass("field-validation-error");
//            $(this).validate().settings.ignore = ":not(.requiredOnDelegate)";
//        }
//        else {
//            $(this).validate().settings.ignore = ":hidden";
//            $(".field-validation-error").addClass("field-validation-valid");
//            $(".field-validation-valid").removeClass("field-validation-error");
//        }
//        $(this).attr("data-ajax-success", "OnSuccessNoRedirect");
//        $(this).find("input[id='ActionStatus']").val($(ele).attr("data-action"));
//        $(this).find("input[id='SendBackTo']").val($(ele).attr("data-sendbackto"));
//        $(this).find("input[id='SendToRole']").val($(ele).attr("data-sendtorole"));
//        if ($(this).find("input[id='ButtonCaption']").length == 0) {
//            var input = $("<input id='ButtonCaption' name='ButtonCaption' type='hidden'/>");
//            input.val($(ele).text());
//            $(this).append(input);
//        } else {
//            $(this).find("input[id='ButtonCaption']").val($(ele).text());
//        }
//        if ($(this).find("#tblquotation").length > 0)
//            isValid = ValidateTableQuotation($(this));

//        if ($(this).find("#tblPaymentTerms").length > 0)
//            isValid = ValidateTablePaymentTerms($(this));

//        if ($(this).find("#tblExpenseCategory").length > 0)
//            isValid = ValidateTableExpenseCategory($(this));

//        if (!$(this).valid()) {
//            isValid = false;
//            try {
//                var validator = $(this).validate();
//                $(validator.errorList).each(function (i, errorItem) {
//                    console.log("{ '" + errorItem.element.id + "' : '" + errorItem.message + "'}");
//                });
//            }
//            catch (e1) {
//                console.log(e1.message);
//            }
//        }
//    });
//    if (isValid) {
//        //// ShowWaitDialog();
//        //alert(_spPageContextInfo.webAbsoluteUrl);
//        //jQuery.ajax({
//        //    type: "GET",
//        //    url: _spPageContextInfo.webAbsoluteUrl +  "/Master/GetTocken",
//        //    global: true,
//        //    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
//        //    async: true,
//        //    cache: false,
//        //    success: function (result) {
//        //        securityToken = result;
//                $(formList[0]).submit();

//        //    },
//        //    error: function (xhr, textStatus, errorThrown) {
//        //      //  HideWaitDialog();
//        //     //   onAjaxError(xhr);
//        //    }

//        //});


//    } else {
//        if ($(".field-validation-error:first").length > 0) {
//            //$("html,body").animate({ "scrollTop": $(".field-validation-error:first").offset().top - 100 });
//            $("html,body").animate({ "scrollTop": $(".field-validation-error:first").parents(".card:first").offset().top - 100 });
//            setTimeout(function () {
//                $(".field-validation-error:first").parent().find("select,input,textarea").first().focus();
//            }, 10);
//        }
//    }
//}