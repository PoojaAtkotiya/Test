var allButtons;
var formStatus;
var currentRoleButtons = [];

function GetButtons(id, currentUserRole,formStatus) {
    GetFormDigest().then(function (data) {
        $.ajax({
            url: "https://bajajelect.sharepoint.com/sites/WFRootDev" + "/_api/web/lists/getbytitle('" + buttonListName + "')/GetItems(query=@v1)?@v1={\"ViewXml\":\"<View><Query><Where><And><Eq><FieldRef Name='ApplicationName' /><Value Type='TaxonomyFieldType'>" + applicationName + "</Value></Eq><Eq><FieldRef Name='FormName' /><Value Type='Text'>" + formName + "</Value></Eq></And></Where></Query></View>\"}",
            type: "POST",
            headers:
            {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json; odata=verbose",
                "X-RequestDigest": data.d.GetContextWebInformation.FormDigestValue
            },
            success: function (data) {
                allButtons = data.d.results;
                GetButtonsByRole(id, currentUserRole,formStatus);
            },
            error: function (data) {
                console.log(data.responseJSON.error);
            }
        });
    });
}
function GetButtonsByRole(id, currentUserRole,formStatus) {
    var btnli = "";
    var buttonCount = 1;

    // if (id > 0 && id != null) {
    //     formStatus = mainListData.Status
    // }
    // else {
    //     formStatus = "New";
    // }
   
    currentRoleButtons=[];
    for (i = 0; i <= allButtons.length - 1; i++) {
        if (allButtons[i].FormName.results[0].Label == formName && allButtons[i].Role.includes(currentUserRole) && allButtons[i].FormStatus.includes(formStatus)) {
            currentRoleButtons.push(allButtons[i]);          
        }
    }

    for (i = 0; i <= currentRoleButtons.length - 1; i++) {
        var jsFuncName = Object.keys(jsFunctionValue).find(k => jsFunctionValue[k] === currentRoleButtons[i].JsFunctionNameId);
        var jsFunc = "onClick=" + jsFuncName + "(this);";

        var status = Object.keys(buttonActionStatus).find(k => buttonActionStatus[k] === currentRoleButtons[i].ButtonActionValueId);
        var isVisible = currentRoleButtons[i].IsVisible ? "" : "class=hide";
        btnli = btnli + '<li class="pull-left"><a id="btn' + (buttonCount++) + '" ' + isVisible + ' onClick="' + jsFuncName + '(this);"' + ' data-action="' + status + '" data-sendbackto="' + currentRoleButtons[i].SendBackTo + '" data-sendtorole="' + currentRoleButtons[i].SendToRole + '" class="btn btn-default" title="' + currentRoleButtons[i].ToolTip + '" data-placement="bottom"><i class="' + currentRoleButtons[i].Icon + '"></i>&nbsp;' + currentRoleButtons[i].Title + '</a></li>'
    }

    btnli = btnli + '<li class="pull-left"><a id="btnExit" class="btn btn-default" onclick="Exit(this);" title="Exit without saving any data"  data-placement="bottom"><i class="fa fa-sign-out"></i>&nbsp;Home</a></li>';

    $('#dynamicButtonli').html(btnli);
}


function SubmitNoRedirect(ele) {  
    var formList = $("form[data-ajax='true']:visible").not(".disabled");
    var isValid = true;
    var dataAction = $(ele).attr("data-action");
    formList.each(function () {
        if ($(this).find(".amount").length > 0) {
            $(this).find(".amount").each(function (i, e) {
                $(e).val($(e).val().replace(/,/g, ''));
            });
        }
        if (dataAction == "1" || dataAction == "33") {
            $(this).validate().settings.ignore = "*";
        }
        else if (dataAction == "22") {
            $(this).validate().settings.ignore = "*";
            $(".field-validation-error").addClass("field-validation-valid");
            $(".field-validation-valid").removeClass("field-validation-error");
            $(this).validate().settings.ignore = ":not(.requiredOnSendBack)";
        }
        else if (dataAction == "41") {
            $(this).validate().settings.ignore = "*";
            $(".field-validation-error").addClass("field-validation-valid");
            $(".field-validation-valid").removeClass("field-validation-error");
            $(this).validate().settings.ignore = ":not(.requiredOnDelegate)";
        }
        else {
            $(this).validate().settings.ignore = ":hidden";
            $(".field-validation-error").addClass("field-validation-valid");
            $(".field-validation-valid").removeClass("field-validation-error");
        }
        $(this).attr("data-ajax-success", "OnSuccessNoRedirect");
        $(this).find("input[id='ActionStatus']").val($(ele).attr("data-action"));
        $(this).find("input[id='SendBackTo']").val($(ele).attr("data-sendbackto"));
        $(this).find("input[id='SendToRole']").val($(ele).attr("data-sendtorole"));
        if ($(this).find("input[id='ButtonCaption']").length == 0) {
            var input = $("<input id='ButtonCaption' name='ButtonCaption' type='hidden'/>");
            input.val($(ele).text());
            $(this).append(input);
        } else {
            $(this).find("input[id='ButtonCaption']").val($(ele).text());
        }
        if ($(this).find("#tblquotation").length > 0)
            isValid = ValidateTableQuotation($(this));

        if ($(this).find("#tblPaymentTerms").length > 0)
            isValid = ValidateTablePaymentTerms($(this));

        if ($(this).find("#tblExpenseCategory").length > 0)
            isValid = ValidateTableExpenseCategory($(this));

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
        ShowWaitDialog();
        jQuery.ajax({
            type: "GET",
            url: BASEPATHURL + "/Master/GetTocken",
            global: true,
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
            async: true,
            cache: false,
            success: function (result) {
                securityToken = result;
                $(formList[0]).submit();

            },
            error: function (xhr, textStatus, errorThrown) {
                HideWaitDialog();
                onAjaxError(xhr);
            }

        });


    } else {
        if ($(".field-validation-error:first").length > 0) {
            //$("html,body").animate({ "scrollTop": $(".field-validation-error:first").offset().top - 100 });
            $("html,body").animate({ "scrollTop": $(".field-validation-error:first").parents(".card:first").offset().top - 100 });
            setTimeout(function () {
                $(".field-validation-error:first").parent().find("select,input,textarea").first().focus();
            }, 10);
        }
    }
}