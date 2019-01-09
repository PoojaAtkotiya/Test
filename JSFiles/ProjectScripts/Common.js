var returnUrl = "";
var currentUser;
var approverMaster;
var securityToken;
var currentContext;
var hostweburl;
var currentContext;
var listDataArray = {};
var actionPerformed;


var scriptbase; //= spSiteUrl + "/_layouts/15/";     ////_spPageContextInfo.layoutsUrl

jQuery(document).ready(function () {
    //   BindDatePicker("");
    KeyPressNumericValidation();

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

    GetAllMasterData();

    if (listItemId != null && listItemId > 0) {
        GetSetFormData();
    }
    else {
        GetGlobalApprovalMatrix(listItemId);
    }

    setCustomApprovers();
}

function onFail(sender, args) {
    console.log(args.get_message());
}

function DatePickerControl(ele) {
    $(ele).find('.datepicker').each(function () {
        $(this).datepicker({
            format: 'dd-mm-yyyy',
            todayHighlight: true,
            autoclose: true
        });
    });
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
function ValidateFormControls(divObjectId, IgnoreBlankValues) {
    if (IgnoreBlankValues == undefined)
        IgnoreBlankValues = true;
    jQuery('#' + divObjectId + ' input:text, #' + divObjectId + ' select, #' + divObjectId + ' textarea').removeClass('input-validation-error');
    var noerror = true;
    jQuery('#' + divObjectId).each(function (i, e) {
        var totalElement = 0;
        var blanckValueCount = 0;
        totalElement = jQuery('input:text,select,textarea', e).length;
        jQuery('input:text,select,textarea', e).each(function (index, control) {
            if (jQuery.trim(jQuery(control).val()) == '') {
                blanckValueCount += 1;
            }
        });

        if (jQuery(e).is(':visible') && ((totalElement != blanckValueCount && IgnoreBlankValues) || !IgnoreBlankValues)) {
            jQuery('input:text,select,textarea', e).each(function (index, control) {
                //Check for valid email text 
                if (jQuery(control).attr('data-type') != undefined && jQuery(control).attr('data-type').toLowerCase() == 'email') {
                    var emailfilter = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
                    if (!(emailfilter.test(jQuery(control).val())) && jQuery(control).val() != '') {
                        jQuery(control).addClass('input-validation-error');
                        noerror = false;
                    }
                }
                if (jQuery(control).attr('required') != undefined) {
                    //check numeric data type validation
                    if (jQuery(control).attr('data') != undefined) {
                        if (parseFloat(jQuery.trim(jQuery(control).val())) == 0) {
                            jQuery(control).addClass('input-validation-error');
                            noerror = false;
                        }
                    }

                    //check string data type validation
                    if (jQuery.trim(jQuery(control).val()) == '') {
                        jQuery(control).addClass('input-validation-error');
                        noerror = false;
                    }
                }

                //numericdatarequired attribute allows 0.00 incase of numeric data
                if (jQuery(control).attr('numericdatarequired') != undefined) {

                    //check numeric data type validation
                    if (jQuery(control).attr('data') != undefined) {
                        if (jQuery.trim(jQuery(control).val()) == '') {
                            jQuery(control).addClass('input-validation-error');
                            noerror = false;
                        }

                    }
                }
            });
        }
    });
    //Display validation message
    if (!noerror) {
        // AlertModal(getMessage("error"), getMessage("ParameterValidationMessage"), function () { })        
        // AlertModal("Error", "Please enter appropriate data.");
    }
    return noerror;
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
    // if ($.trim(selector) != "") {
    //     selector += selector + " ";
    // }
    var todayDate = new Date();
    $(selector).find('.datepicker').each(function () {
        var tempValue = $(this).find("input:first").val();
        $(this).datetimepicker({
            format: 'L', //for Date+++
            widgetParent: $(this).parent().is("td") ? "body" : null,
            //widgetPositioning: $(this).parent().is("td") ? { horizontal: "left", vertical: "bottom" } : { horizontal: "auto", vertical: "auto" },
            minDate: $(this).hasClass("pastDisabled") ? new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 00, 00, 00) : undefined
        }).on("dp.change", function () {
            $(this).find("input").change();
        });
        $(this).find("input:first").val(tempValue);
    });
    $(selector).find('.timepicker').each(function () {
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
        case "number":
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
        case "hidden":
            $("#" + controlId).val(item[fieldName]);
            break;
    }
}

function GetItemTypeForListName(name) {
    return "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1) + "ListItem";
}

function ConfirmationDailog(options) {
    $("#ConfirmDialog").remove();
    var confirmDlg = "<div class='modal fade bs-example-modal-sm' tabindex='-1' role='dialog' id='ConfirmDialog' aria-labelledby='mySmallModalLabel'><div class='modal-dialog modal-sm'><div class='modal-content'><div class='modal-header'>" +
        "<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button><h4 class='modal-title' id='ModalTitle'>Modal title</h4></div><div class='modal-body' id='ModalContent'>" +
        "</div><div class='modal-footer'><button type='button' id='btnYesPopup' isdialogclose='false' class='btn btn-default' data-dismiss='modal'>" +
        "Yes</button><button type='button' id='btnNoPopup' isdialogclose='false' class='btn btn-default' data-dismiss='modal'>No</button> </div></div></div></div>";
    $(confirmDlg).appendTo("body");
    $("#ConfirmDialog #btnYesPopup").on("click", function () {
        if (typeof (options.okCallback) !== "undefined" && options.okCallback != null) {
            //options.okCallback();
            ConfirmPopupYes(options.url, options.id, options.okCallback);
        }
    });
    $("#ConfirmDialog #btnNoPopup").on("click", function () {
        if (typeof (options.cancelCallback) !== "undefined" && options.cancelCallback != null) {
            options.cancelCallback();
        }
    });
    $("#ConfirmDialog #ModalTitle").text(options.title);
    $("#ConfirmDialog #ModalContent").text(options.message);
    $("#ConfirmDialog").modal('show').on('hidden.bs.modal', function () {
        if (typeof (options.closeCallback) !== "undefined" && options.closeCallback != null) {
            options.closeCallback();
        }
    });
}

function ConfirmPopupYes(url, id, okCallback) {
    if (typeof (url) !== "undefined" && url != null) {
        url = url;
        $.ajax
            ({
                url: url,
                type: "DELETE",
                headers: {
                    "accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "IF-MATCH": "*"
                },
                success: function (data) {
                    if (typeof (okCallback) !== "undefined" && okCallback != null) {
                        okCallback(id, data);
                    }
                }
            });


        //     jQuery.post(url, {
        //         Id: id
        //     }, function (data) {
        //         if (typeof (okCallback) !== "undefined" && okCallback != null) {
        //             okCallback(id, data);
        //         }
        //     }).fail(function (xhr) {
        //         onAjaxError(xhr);
        //     });
    }
    else {
        if (typeof (okCallback) !== "undefined" && okCallback != null) {
            okCallback();
        }
        //HideWaitDialog();
    }
}

function AlertModal(title, msg, isExit, callback) {
    $("div[id='PopupDialog']").remove();
    var popupDlg = '<div class="modal fade bs-example-modal-sm" tabindex="-1" role="dialog" id="PopupDialog" aria-labelledby="mySmallModalLabel"><div class="modal-dialog modal-sm"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" id="ModalTitle">Modal title</h4></div><div class="modal-body" id="ModalContent"></div><div class="modal-footer"><button type="button" id="ClosePopup" isdialogclose="false" class="btn btn-default" data-dismiss="modal">Close</button> </div></div></div></div>';
    $(popupDlg).appendTo("body");
    $("#PopupDialog #ModalTitle").text(title);
    $("#PopupDialog #ModalContent").html(msg);
    if (title == "Success") {
        $("#PopupDialog .modal-header").addClass("bg-success text-white");
    }
    else if (title == "Error") {
        $("#PopupDialog .modal-header").addClass("bg-danger text-white");
    }
    else if (title == "Validation") {
        $("#PopupDialog .modal-header").addClass("bg-yellow text-white");
    }
    else if (title == "SessionTimeout") {
        $("#PopupDialog .modal-header").addClass("bg-warning text-white");
    }
    $("#PopupDialog").modal('show').on('hidden.bs.modal', function () {
        if (typeof (callback) !== 'undefined' && callback != null) {
            callback();
        }
        if (typeof (isExit) !== 'undefined' && isExit == true) {
            // Exit();
        }
        if (callback == null) {
            $("div[id='PopupDialog']").hide();
            $("div[id='PopupDialog']").remove();
        }
    });
}

function UserAborted(xhr) {
    return !xhr.getAllResponseHeaders();
}
function onAjaxError(xhr) {
    if (!UserAborted(xhr)) {
        if (xhr.status.toString().substr(0, 1) == "4" || xhr.status == 504) {
            AlertModal('SessionTimeout', "Session Timed out!!!");
        }
        else {
            //This shortcut is not recommended way to track unauthorized action.
            //if (xhr.responseText.indexOf("403.png") > 0) {
            //    window.location = UnAuthorizationUrl;
            //}
            //else {
            //    AlertModal("Error", "System error has occurred.", BootstrapDialog.TYPE_DANGER);
            //}
        }
    }
}

function OnSuccess(data, status, xhr) {
    try {
        if (data.IsSucceed) {
            if (data.IsFile) {
                DownloadUploadedFile("<a data-url='" + data.ExtraData + "'/>", function () {
                    ShowWaitDialog();
                    setTimeout(function () {
                        window.location = window.location.href + (window.location.href.indexOf('?') >= 0 ? "&" : "?");
                    }, 2000)
                });
            } else {
                var msg = '';
                if (data.ExtraData != null) {
                    msg = "<b>" + data.ExtraData + "</b>" + "<br>" + ParseMessage(data.Messages);
                }
                else {
                    if ($("#ReferenceNo").length != 0) {
                        msg = $("#ReferenceNo").html() + "<br>" + ParseMessage(data.Messages);
                    }
                    else {
                        msg = ParseMessage(data.Messages);
                    }
                    ////msg = $("#ReferenceNo").html() + "<br>" + ParseMessage(data.Messages);
                }
                //AlertModal('Success', ParseMessage(data.Messages), true);
                AlertModal('Success', msg, true);
            }
        } else {
            AlertModal('Error', ParseMessage(data.Messages));
        }
    }
    catch (e) { window.location.reload(); }
}

function OnFailure(xhr, status, error) {
    try {
        if (xhr.status.toString().substr(0, 1) == "4" || xhr.status == 504) {
            AlertModal('SessionTimeout', ResourceManager.Message.SessionTimeOut);
        }
        else {
            AlertModal('Error', ResourceManager.Message.Error);
        }
    }
    catch (e) { window.location.reload(); }
}


function OnDelete(ele) {
    var Id = $('#ListDetails_0__ItemId').val();
    console.log("Id = " + Id);
    ConfirmationDailog({
        title: "Delete Request", message: "Are you sure to 'Delete'?", id: Id, url: "/NewArtwork/DeleteArwork", okCallback: function (id, data) {
            ShowWaitDialog();
            if (data.IsSucceed) {
                AlertModal("Success", ParseMessage(data.Messages), true);
            }
            else {
                AlertModal("Error", ParseMessage(data.Messages), true)
            }


        }
    });
}
function resetFormValidator(formId) {
    $(formId).removeData('validator');
    $(formId).removeData('unobtrusiveValidation');
    $(formId).data('validator');
    $(formId).data('unobtrusiveValidation');
    $.validator.unobtrusive.parse(formId);
}

// $(document).bind('bindForm', function (e) {
//     var activedivId = $('div[section]').not(".disabled").attr('id');
//     var parentDiv = $('div[section]').not(".disabled").parent();
//     var form = '<form data-ajax="true" enctype="multipart/form-data" id="form_' + activedivId + '" method="post" autocomplete="off"/>';
//     $('#' + activedivId).remove();
//     $(document.body).find($(parentDiv)).append($(formList)[0].outerHTML);   
//     resetFormValidator('#form_' + activedivId);  
// });


<<<<<<< HEAD
function ValidateForm(ele) {
    //Get Active Section
    var formList = $('div[section]').not(".disabled").parent();
=======
function ValidateForm(ele, saveCallBack) {
    //Get Active Section
    var activeSection = $('div[section]').not(".disabled");
    var formList = $(activeSection).parent();
>>>>>>> 595441733745fb4b710ea0f0f29e13d89a364b3d

    var isValid = true;
    var dataAction = $(ele).attr("data-action");
    var isPageRedirect = true;
    var buttonCaption = $(ele).text().toLowerCase().trim();

    if (buttonCaption == "hold" || buttonCaption == "resume") {
        $("#Action").rules("remove", "required");
    }

    if (buttonCaption == "print") {
        $('#printModel').modal('show');
    }

    if (buttonCaption != "print") {
        formList.each(function () {
            if ($(this).find("input[id='ButtonCaption']").length == 0) {
                var input = $("<input id='ButtonCaption' name='ButtonCaption' type='hidden'/>");
                input.val($(ele).text());
                $(this).append(input);
            } else {
                $(this).find("input[id='ButtonCaption']").val($(ele).text());
            }

            if ($(this).find("input[id='ButtonCaption']").val() != undefined && $(this).find("input[id='ButtonCaption']").val().trim() == "Submit" && $(this).find('.multiselectrequired').length > 0) {
                if ($(this).find('.multiselectrequired').attr('data-val') == "true" && $(this).find('.multiselectrequired').attr('data-original-title') == '' && $(this).find('.multiselectrequired').attr('required') == 'required') {
                    $(this).find('.multiselectrequired').next('div.btn-group').addClass('input-validation-error');
                    $(this).find('.multiselectrequired').next('div.btn-group').next("span.field-validation-valid").addClass("error");
                    $(this).find('.multiselectrequired').next('div.btn-group').next("span.error").removeClass("field-validation-valid");
                    isValid = false;
                }
            }
            else if ($(this).find("input[id='ButtonCaption']").val() != undefined && $(this).find("input[id='ButtonCaption']").val().trim() == 'Delegate' && $(this).find('.multiselectrequired').length > 0) {
                $(this).find('.multiselectrequired').next('div.btn-group.input-validation-error').removeClass('input-validation-error');
                $("form").validate().resetForm();
            }

            if ($(this).find(".amount").length > 0) {
                $(this).find(".amount").each(function (i, e) {
                    $(e).val($(e).val().replace(/,/g, ''));
                });
            }

            if (dataAction == "1" || dataAction == "33") {
                $(this).validate().settings.ignore = "*";
                if (buttonCaption == "submit" || buttonCaption == "complete") {
                    $(".error").addClass("valid");
                    $(".valid").removeClass("error");
                }
            }
            else if (dataAction == "22") {
                $(this).validate().settings.ignore = "*";
                $(".error").addClass("valid");
                $(".valid").removeClass("error");
                $(this).validate().settings.ignore = ":not(.requiredOnSendBack)";
            }
            else if (dataAction == "40") {
                $(this).validate().settings.ignore = "*";
                $(".error").addClass("valid");
                $(".valid").removeClass("error");
                $(this).validate().settings.ignore = ":not(.requiredOnReject)";
            }
            else if (dataAction == "41") {
                $(this).validate().settings.ignore = "*";
                $(".error").addClass("valid");
                $(".valid").removeClass("error");
                $(this).validate().settings.ignore = ":not(.requiredOnDelegate)";
            }
            else {
                $(this).validate().settings.ignore = ":hidden";
                if (buttonCaption == "save as draft") {
                    $(".error").addClass("valid");
                    $(".valid").removeClass("error");
                }
            }
            if (buttonCaption == "save as draft" || buttonCaption == "resume") {
                $(this).attr("data-ajax-success", "OnSuccessNoRedirect");
            }
            else if (buttonCaption == "complete" && !isPageRedirect) {
                $(this).attr("data-ajax-success", "ConfirmSubmitNoRedirect");
            }
            else {
                $(this).attr("data-ajax-success", $(this).attr("data-ajax-old-success"));
            }
            $(this).find("input[id='ActionStatus']").val($(ele).attr("data-action"));
            $(this).find("input[id='SendBackTo']").val($(ele).attr("data-sendbackto"));
            $(this).find("input[id='SendToRole']").val($(ele).attr("data-sendtorole"));

            if (!$(this).valid()) {
                isValid = false;
                try {
                    var validator = $(this).validate();
                    $(validator.errorList).each(function (i, errorItem) {
                        //  AlertModal("Validation", errorItem.element.id + "' : '" + errorItem.message);
                        $("#" + errorItem.element.id).addClass("error");
                        $("#" + errorItem.element.id).removeClass("valid");
                        $("#" + errorItem.element.id).next().remove();
                        console.log("{ '" + errorItem.element.id + "' : '" + errorItem.message + "'}");
                    });
                }
                catch (e1) {
                    console.log(e1.message);
                }
            }
        });
    }
    if (isValid) {
        if (buttonCaption != "save as draft") {
            //confirm file Attachment need attach or not
            var attachmsg = "Are you sure to '" + $.trim($(ele).text()) + "'?";
            if ($(formList).find("div[data-appname]").length != 0 && $(formList).find("div[data-appname]").find("ul li").length == 0 && dataAction == "10") {
                attachmsg = "Are you sure to '" + $.trim($(ele).text()) + "' without attachment?";
            }
            ConfirmationDailog({
<<<<<<< HEAD
                title: "Confirm", message: attachmsg, okCallback: function (id, data) {

                }
=======
                title: "Confirm", message: attachmsg, okCallback: saveCallBack(activeSection)
>>>>>>> 595441733745fb4b710ea0f0f29e13d89a364b3d
            });
        }
        else {
            saveCallBack(activeSection);
        }
    }
<<<<<<< HEAD
    return isValid;
=======
>>>>>>> 595441733745fb4b710ea0f0f29e13d89a364b3d
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
            if (!IsStrNullOrEmpty($(obj).val())) {
                listDataArray[id] = $(obj).val();
            }
            break;
        // case "number":
        //     listDataArray[id] = Number($(this).val());
        //     break;
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
            var month = !IsNullOrUndefined($(obj).datepicker('getDate')) ? $(obj).datepicker('getDate').getMonth() + 1 : null;
            var date = !IsNullOrUndefined($(obj).datepicker('getDate')) ? $(obj).datepicker('getDate').getDate() : null;
            var year = !IsNullOrUndefined($(obj).datepicker('getDate')) ? $(obj).datepicker('getDate').getFullYear() : null;
            var date = (!IsNullOrUndefined(month) && !IsNullOrUndefined(date) && !IsNullOrUndefined(year)) ? new Date(year.toString() + "-" + month.toString() + "-" + date.toString()).format("yyyy-MM-ddTHH:mm:ssZ") : null;
            if (date) {
                listDataArray[id] = date;
            }
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

function SaveFormData() {
    var mainListName = $('#divItemCodeForm').attr('mainlistname');
    if (mainListName != undefined && mainListName != '' && mainListName != null) {
        $('#divItemCodeForm').find('div[section]').not(".disabled").each(function (i, e) {
            var sectionName = $(e).attr('section');
            var activeSectionId = $(e).attr('id');

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
                ////AddAttachments(itemID);
                AddAllAttachments(listname, itemID);
                var web, clientContext;
                SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
                    clientContext = new SP.ClientContext.get_current();
                    web = clientContext.get_web();
                    oList = web.get_lists().getByTitle(listname);
                    var oListItem = oList.getItemById(itemID);

                    clientContext.load(oListItem, 'FormLevel', 'ProposedBy');
                    clientContext.load(web);
                    clientContext.executeQueryAsync(function () {
                        ///Pending -- temporary
                        var param = [
                            SendToLevel = 0
                        ];

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