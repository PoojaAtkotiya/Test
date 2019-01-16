var returnUrl = "";
var currentUser;
var approverMaster;
var securityToken;
var currentContext;
var hostweburl;
var listDataArray = {};
var actionPerformed;
var fileInfos = [];
var scriptbase; //= spSiteUrl + "/_layouts/15/";     ////_spPageContextInfo.layoutsUrl
var fileIdCounter = 0;

jQuery(document).ready(function () {
    // BindDatePicker("");
    KeyPressNumericValidation();
    // LoadWaitDialog();
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
function BindAttachmentFiles() {
    var output = [];

    //Get the File Upload control id
    var input = document.getElementById("UploadArtworkAttachment");
    var fileCount = input.files.length;
    console.log(fileCount);
    for (var i = 0; i < fileCount; i++) {
        var fileName = input.files[i].name;
        console.log(fileName);
        fileIdCounter++;
        var fileId = fileIdCounter;
        var file = input.files[i];
        var reader = new FileReader();
        reader.onload = (function (file) {
            return function (e) {
                console.log(file.name);
                //Push the converted file into array
                fileInfos.push({
                    "name": file.name,
                    "content": e.target.result,
                    "id": fileId
                });
                console.log(fileInfos);
            }
        })(file);
        reader.readAsArrayBuffer(file);
        var removeLink = "<a id =\"removeFile_" + fileId + "\" href=\"javascript:removeFiles(" + fileId + ")\" data-fileid=\"" + fileId + "\">Remove</a>";
        output.push("<li><strong>", escape(file.name), removeLink, "</li> ");
    }
    $('#UploadArtworkAttachment').next().append(output.join(""));

    //End of for loop
}

function removeFiles(fileId) {

    for (var i = 0; i < fileInfos.length; ++i) {
        if (fileInfos[i].id === fileId)
            fileInfos.splice(i, 1);
    }
    var item = document.getElementById("fileList");
    fileId--;
    item.children[fileId].remove();

}
function loadConstants() {
    var clientContext = new SP.ClientContext("https://bajajelect.sharepoint.com/sites/MTDEV");
    this.oWebsite = clientContext.get_web();
    clientContext.load(this.oWebsite);
    clientContext.executeQueryAsync(
        Function.createDelegate(this, onloadConstantsSuccess),
        Function.createDelegate(this, onloadConstantsFail)
    );
}

function onloadConstantsSuccess(sender, args) {

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

function onloadConstantsFail(sender, args) {
    console.log(args.get_message());
}

function ShowWaitDialog() {
    try {
        jQuery("#loading").show();
    }
    catch (ex) {
        // blank catch to handle ie issue in case of CK editor
    }
}

function HideWaitDialog() {
    jQuery("#loading").hide();
}

function DatePickerControl(ele) {
    $(ele).find('.datepicker').each(function () {
        $(this).datepicker({
            format: 'mm-dd-yyyy',
            todayHighlight: true,
            autoclose: true
        });
    });
}

function GetUsersForDDL(roleName, eleID) {
    //sync call to avoid conflicts in deriving role wise users
    AjaxCall(
        {
            url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('ApproverMaster')/items?$select=Role,UserSelection,UserName/Id,UserName/Title&$expand=UserName/Id&$expand=UserName/Id&$filter= (Role eq '" + roleName + "') and (UserSelection eq 1)",
            httpmethod: 'GET',
            calldatatype: 'JSON',
            isAsync: false,
            sucesscallbackfunction: function (data) {
                OnGetUsersForDDLSuccess(data, eleID);
            }
        });
}

function OnGetUsersForDDLSuccess(data, eleID) {
    var dataResults = data.value[0].UserName;
    var allUsers = [];
    if (!IsNullOrUndefined(dataResults) && dataResults.length != -1) {
        $.each(dataResults, function (index, user) {
            allUsers.push({ userId: user.Id, userName: user.Title })
        });
    }
    setUsersInDDL(allUsers, eleID);
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
    AjaxCall(
        {
            url: "https://bajajelect.sharepoint.com/sites/MTDEV/_api/web/currentuser",
            httpmethod: 'GET',
            calldatatype: 'JSON',
            isAsync: false,
            headers: {
                Accept: "application/json;odata=verbose"
            },
            sucesscallbackfunction: function (data) {
                currentUser = data.d;
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
    ShowWaitDialog();
    if (typeof (url) !== "undefined" && url != null) {
        url = url;
        AjaxCall(
            {
                url: url,
                httpmethod: 'DELETE',
                calldatatype: 'JSON',
                isAsync: false,
                headers: {
                    "accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "IF-MATCH": "*"
                },
                sucesscallbackfunction: function (data) {
                    if (typeof (okCallback) !== "undefined" && okCallback != null) {
                        okCallback(id, data);
                    }
                    HideWaitDialog();
                }
            });
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

function ValidateForm(ele, saveCallBack) {
    //Get Active Section
    var activeSection = $('div[section]').not(".disabled");
    //  var formList = $(activeSection).parent();
    var formList = $(activeSection);
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

            if (dataAction == "2" || dataAction == "34") {
                $(this).validate().settings.ignore = "*";
                if (buttonCaption == "submit" || buttonCaption == "complete") {
                    $(".error").addClass("valid");
                    $(".valid").removeClass("error");
                }
            }
            else if (dataAction == "23") {
                $(this).validate().settings.ignore = "*";
                $(".error").addClass("valid");
                $(".valid").removeClass("error");
                $(this).validate().settings.ignore = ":not(.requiredOnSendBack)";
            }
            else if (dataAction == "41") {
                $(this).validate().settings.ignore = "*";
                $(".error").addClass("valid");
                $(".valid").removeClass("error");
                $(this).validate().settings.ignore = ":not(.requiredOnReject)";
            }
            else if (dataAction == "42") {
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


            // if (!$(this).valid()) {
            //     isValid = false;
            //     try {
            //         var validator = $(this).validate();
            //         $(validator.errorList).each(function (i, errorItem) {
            //             //  AlertModal("Validation", errorItem.element.id + "' : '" + errorItem.message);
            //             $("#" + errorItem.element.id).addClass("error");
            //             $("#" + errorItem.element.id).removeClass("valid");
            //             $("#" + errorItem.element.id).next().remove();
            //             console.log("{ '" + errorItem.element.id + "' : '" + errorItem.message + "'}");
            //         });
            //     }
            //     catch (e1) {
            //         console.log(e1.message);
            //     }
            // }
        });
    }
    if (isValid) {
        $("input[id='ActionStatus']").val($(ele).attr("data-action"));
        $("input[id='SendBackTo']").val($(ele).attr("data-sendbackto"));
        $("input[id='SendToRole']").val($(ele).attr("data-sendtorole"));
        ShowWaitDialog();
        if (buttonCaption != "save as draft") {
            //confirm file Attachment need attach or not
            var attachmsg = "Are you sure to '" + $.trim($(ele).text()) + "'?";
            if ($(formList).find("div[data-appname]").length != 0 && $(formList).find("div[data-appname]").find("ul li").length == 0 && dataAction == "11") {
                attachmsg = "Are you sure to '" + $.trim($(ele).text()) + "' without attachment?";
            }
            ConfirmationDailog({
                title: "Confirm", message: attachmsg, okCallback: function (data) {
                    saveCallBack(activeSection);
                }
            });
        }
        else {
            saveCallBack(activeSection);
        }
        HideWaitDialog();
    }
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
    AjaxCall(
        {
            url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + ApproverMasterListName + "')/items",
            httpmethod: 'GET',
            calldatatype: 'JSON',
            isAsync: false,
            headers: {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            sucesscallbackfunction: function (data) {
                approverMaster = data.d.results;
            }
        });
}

function GetActivityLog(activityLogListName, lookupId, tableId) {
    AjaxCall(
        {
            url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + activityLogListName + "')/items?$select=Author/Title,*&$expand=Author&$filter=RequestID eq '" + lookupId + "'",
            httpmethod: 'GET',
            calldatatype: 'JSON',
            isAsync: false,
            headers: {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            sucesscallbackfunction: function (data) {
                if (!IsNullOrUndefined(data) && !IsNullOrUndefined(data.d) && !IsNullOrUndefined(data.d.results) && data.d.results.length > 0) {
                    DisplayActivityLogDetails(data.d.results, tableId);
                }
            }
        });
}

function DisplayActivityLogDetails(activityLogResult, tableId) {
    var tr, ActivityDate = "-";

    for (var i = 0; i < activityLogResult.length; i++) {
        if (!IsNullOrUndefined(activityLogResult[i].ActivityDate)) {
            ActivityDate = formatDate(new Date(activityLogResult[i].ActivityDate).toLocaleDateString());
        }
        tr = $('<tr/>');
        tr.append("<td width='15%'>" + activityLogResult[i].Activity + "</td>");
        tr.append("<td width='15%'>" + activityLogResult[i].SectionName + "</td>");
        tr.append("<td width='15%'>" + ActivityDate + "</td>");
        tr.append("<td width='15%'>" + activityLogResult[i].ActivityBy + "</td>");
        // tr.append("<td width='15%'>" + activityLogResult[i].ActivityById + "</td>");
        tr.append("<td width='20%'>" + ActvityLogChanges(i, activityLogResult[i].Changes) + "</td>");
        $('#' + tableId).append(tr);
    }
}

function ActvityLogChanges(iteration, activityLogChangeDetails) {
    if (!IsNullOrUndefined(activityLogChangeDetails)) {
        $('#ActivityLogChanges').show();
        var activity = activityLogChangeDetails.split('~');
        var tr, tdValue;
        for (var i = 0; i < activity.length; i++) {
            var item = activity[i];
            if (!IsNullOrUndefined(item) && item.split('\t').length == 2) {
                var valueparts = item.split('\t');
                if (valueparts[0] != "ProposedBy" && valueparts[0] != "Files") {
                    tr = $('<tr/>');
                    tr.append('<td>' + valueparts[0] + '</td>');

                    var value = valueparts[1];
                    try {
                        if (value.toLowerCase() == "true" || value.toLowerCase() == "false") {
                            tdValue = value.toLowerCase() == "true" ? "Yes" : "No";
                        }
                        else {
                            if (value.contains("/") && value.contains(":") && (value.contains("AM") || value.contains("PM"))) {
                                var datetimepart = value.split(' ');
                                var datepart = datetimepart[0].split('/');
                                var dt = new DateTime(parseInt(datepart[2]), parseInt(datepart[0]), parseInt(datepart[1]));
                                tdValue = dt.toString("dd/MM/yyyy") + (valueparts[0].toLowerCase().contains("time") ? " " + datetimepart[1] + " " + datetimepart[2] : "");
                            }
                            else {
                                tdValue = value;
                            }
                        }

                    }
                    catch
                    {
                        tdValue = value;
                    }

                    tr.append('<td>' + tdValue + '</td>');
                    $('#tblActivityChanges').append(tr);
                }
            }
        }
    }


    //    var activityChangesHtml='<a href="#" data-toggle="modal" data-target="#activityDetail_'+iteration+'" class="btn btn-primary">Activity Log</a>'+
    //     '<div class="modal fade" id="activityDetail_'+iteration+'" tabindex="-1" role="dialog" aria-labelledby="activityDetail_'+iteration+'Label">'+
    //         '<div class="modal-dialog" role="document">'+
    //             '<div class="modal-content">'+
    //                 '<div class="modal-header">'+
    //                     '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
    //                     '<h4 class="modal-title" id="activityDetail_'+iteration+'Label">Activity Log</h4>'+
    //                 '</div>'+
    //                 '<div class="modal-body">'+
    //                    string[] actchangeslist = item.Changes.Split('~');
    //                     <table class="table table-hover table-bordered someTable">
    //                         <thead>
    //                             <tr>
    //                                 <th>@Html.ResourceValue("Text_Field", ResourceName.Common)</th>
    //                                 <th>@Html.ResourceValue("Text_Value", ResourceName.Common_ActivityLogs)</th>
    //                             </tr>
    //                         </thead>
    //                         <tbody>
    // foreach (string c in actchangeslist)
    // {
    //     if (!string.IsNullOrEmpty(c) && c.Split('\t').Length == 2)
    //     {
    //         string[] valueparts = c.Split('\t');
    //         if (valueparts[0] != "ProposedBy" && valueparts[0] != "Files")
    //         {
    //             <tr>
    //                 <td>
    //                     @Html.Label(valueparts[0], resources)
    //                 </td>
    //                 <td>
    //                     @{
    //             string value = valueparts[1];
    //             try
    //             {
    //                 if (value.ToLower().Equals("true") || value.ToLower().Equals("false"))
    //                 {
    //                     string boolValue = value.ToLower().Equals("true") ? "Yes" : "No";
    //                     @(new MvcHtmlString(boolValue))
    //                 }
    //                 else
    //                 {
    //                     if (value.Contains("/") && value.Contains(":") && (value.Contains("AM") || value.Contains("PM")))
    //                     {
    //                         string[] datetimepart = value.Split(' ');
    //                         string[] datepart = datetimepart[0].Split('/');
    //                         DateTime dt = new DateTime(int.Parse(datepart[2]), int.Parse(datepart[0]), int.Parse(datepart[1]));
    //                         @(new MvcHtmlString(dt.ToString("dd/MM/yyyy") + (valueparts[0].ToLower().Contains("time") ? " " + datetimepart[1] + " " + datetimepart[2] : "")))
    //                     }
    //                     else
    //                     {
    //                         @(new MvcHtmlString(value))
    //                     }
    //                 }

    //             }
    //             catch
    //             {
    //                 @(new MvcHtmlString(value))
    //             }
    //                     }
    //                 </td>
    //             </tr>
    //         }
    //     }
    // }
    //                     </tbody>
    //                 </table>
    //                 }
    //             </div>
    //             <div class="modal-footer">
    //                 <button type="button" class="btn btn-default" data-dismiss="modal">
    //                     @Html.ResourceValue("Button_Text_Close", ResourceName.Common)
    //                 </button>
    //             </div>
    //         </div>
    //     </div>
    // </div>
    //}
}

function DisplayApplicationStatus(approverMatrix) {
    var tr;
    var result = [];

    for (var i = 0; i < approverMatrix.length; i++) {
        if (approverMatrix[i].Levels >= 0 && !IsNullOrUndefined(approverMatrix[i].Approver) && !IsNullOrUndefined(approverMatrix[i].Approver.results) && !IsNullOrUndefined(approverMatrix[i].Approver.results).length > 0) {
            var AssignDate = "-", DueDate = "-", ApprovalDate = "-", Comments = "-", Status = "-";

            if (!IsNullOrUndefined(approverMatrix[i].Status)) {
                if (approverMatrix[i].Status == ApproverStatus.APPROVED) {
                    Status = ApproverStatus.COMPLETED;
                }
                else {
                    Status = approverMatrix[i].Status;
                }
            }

            if (!IsNullOrUndefined(approverMatrix[i].AssignDate)) {
                AssignDate = formatDate(new Date(approverMatrix[i].AssignDate).toLocaleDateString());
            }
            if (!IsNullOrUndefined(approverMatrix[i].DueDate)) {
                DueDate = formatDate(new Date(approverMatrix[i].DueDate).toLocaleDateString());
            }
            if (!IsNullOrUndefined(approverMatrix[i].ApprovalDate) && approverMatrix[i].Status == ApproverStatus.APPROVED) {
                ApprovalDate = formatDate(new Date(approverMatrix[i].ApprovalDate).toLocaleDateString());
            }
            if (!IsNullOrUndefined(approverMatrix[i].Comments)) {
                Comments = approverMatrix[i].Comments;
            }

            tr = $('<tr/>');
            tr.append("<td width='15%'>" + approverMatrix[i].Role + "</td>");
            tr.append("<td width='10%'>" + approverMatrix[i].ApproverId.results + "</td>");
            tr.append("<td width='10%'>" + Status + "</td>");
            tr.append("<td width='15%'>" + AssignDate + "</td>");
            tr.append("<td width='15%'>" + DueDate + "</td>");
            tr.append("<td width='15%'>" + ApprovalDate + "</td>");
            tr.append("<td width='20%'>" + Comments + "</td>");
            $('#tblApplicationStatus').append(tr);
        }
    }
}

function formatDate(input) {
    var datePart = input.match(/\d+/g);
    var day = (datePart[1].length > 1) ? datePart[1] : "0" + datePart[1];
    var month = (datePart[0].length > 1) ? datePart[0] : "0" + datePart[0];
    var year = datePart[2];
    return day + '/' + month + '/' + year;
}

function SaveFormData(activeSection) {
    var mainListName = $($('div').find('[mainlistname]')).attr('mainlistname');
    if (mainListName != undefined && mainListName != '' && mainListName != null) {

        var sectionName = $(activeSection).attr('section');
        var activeSectionId = $(activeSection).attr('id');

        $(activeSection).find('input[listtype=main],select[listtype=main],radio[listtype=main],textarea[listtype=main],label[listtype=main],input[reflisttype=main],select[reflisttype=main],radio[reflisttype=main],textarea[reflisttype=main],label[reflisttype=main]').each(function () {
            var elementId = $(this).attr('id');
            var elementType = $(this).attr('controlType');
            listDataArray = GetFormControlsValue(elementId, elementType, listDataArray);
        });


        SaveData(mainListName, listDataArray, sectionName);
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

        AjaxCall({
            url: url,
            postData: JSON.stringify(listDataArray),
            httpmethod: 'POST',
            calldatatype: 'JSON',
            headers: headers,
            contentType: 'application/json; charset=utf-8',
            sucesscallbackfunction: function (data) {
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
                        SaveLocalApprovalMatrix(sectionName, itemID, listname, isNewItem, oListItem, ItemCodeApprovalMatrixListName);
                        debugger;
                        if (data != undefined && data != null && data.d != null) {
                            SaveTranListData(itemID);
                        }
                        else {
                            SaveTranListData(itemID);
                        }
                        HideWaitDialog();
                        AlertModal("Success", "Data saved successfully", false, null);

                    }, function (sender, args) {
                        HideWaitDialog();
                        console.log('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
                    });
                });
            },
            error: function (data) {
                console.log(data);
                HideWaitDialog();
            }
        });
    }
}

function OnSuccessNoRedirect(data, status, xhr) {
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
                AlertModal('Success', ParseMessage(data.Messages), false, function () {
                    if (window.location.href.indexOf('&id=' + data.ItemID + "&") >= 0) {
                        ShowWaitDialog();
                        window.location = window.location.href;
                    } else {
                        ShowWaitDialog();
                        window.location = window.location.href.replace("&id={ItemId}&", "&id=" + data.ItemID + "&").replace("&id=", "&id=" + data.ItemID + "&");
                    }
                });
            }
        }
        else {
            AlertModal('Error', ParseMessage(data.Messages));
        }
    }
    catch (e) { window.location.reload(); }
}

function AjaxCall(options) {
    var url = options.url;
    var postData = options.postData;
    var httpmethod = options.httpmethod;
    var calldatatype = options.calldatatype;
    var headers = options.headers == undefined ? "" : options.headers;
    var sucesscallbackfunction = options.sucesscallbackfunction;
    var contentType = options.contentType == undefined ? "application/x-www-form-urlencoded;charset=UTF-8" : options.contentType;
    var showLoading = options.showLoading == undefined ? true : options.showLoading;
    var isAsync = options.isAsync == undefined ? true : options.isAsync;

    jQuery.ajax({
        type: httpmethod,
        url: url,
        data: postData,
        headers: headers,
        global: showLoading,
        dataType: calldatatype,
        contentType: contentType,
        async: isAsync,
        success: function (data) {
            if (data && data.Status != undefined && data.Status == "VALIDATION_ERROR") {
                ShowError(data.Data);
            }
            else {
                if (sucesscallbackfunction != '') {
                    sucesscallbackfunction(data);
                }
            }
        },
        error: function (xhr, textStatus, errorThrown) {

            if (!UserAborted(xhr)) {
                // if (xhr.status == 403) {
                //     window.location = LoginindexUrl;
                // }
                // //This shortcut is not recommended way to track unauthorized action. 
                // if (xhr.responseText.indexOf("403.png") > 0) {
                //     window.location = UnAuthorizationUrl;
                // }
                // else {
                AlertModal("Error", "Oops! Something went wrong");
                //}

            }

        }
    });
}

function UserAborted(xhr) {
    return !xhr.getAllResponseHeaders();
}

function ShowError(ModelStateErrors) {
    jQuery('input').removeClass("input-validation-error")
    var messages = "";
    jQuery(ModelStateErrors).each(function (i, e) {
        jQuery('[name="' + e.Key + '"]').addClass("input-validation-error");
        messages += "<li>" + e.Value[0] + "</li>";
    });
    messages = "<div><h5>" + getMessage("errorTitle") + "</h5><ul>" + messages + "</ul></div>";
    AlertModal(getMessage("error"), messages, function () { })
}