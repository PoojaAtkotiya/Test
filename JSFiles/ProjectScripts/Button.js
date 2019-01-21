var allButtons;
var formStatus;
var currentRoleButtons = [];

function GetButtons(id, currentUserRole, formStatus) {
    GetFormDigest().then(function (data) {
        AjaxCall(
            {
                url: "https://bajajelect.sharepoint.com/sites/WFRootDev" + "/_api/web/lists/getbytitle('" + ListNames.BUTTONLIST + "')/GetItems(query=@v1)?@v1={\"ViewXml\":\"<View><Query><Where><And><Eq><FieldRef Name='ApplicationName' /><Value Type='TaxonomyFieldType'>" + CommonConstant.APPLICATIONNAME + "</Value></Eq><Eq><FieldRef Name='FormName' /><Value Type='Text'>" + CommonConstant.FORMNAME + "</Value></Eq></And></Where></Query></View>\"}",
                httpmethod: 'POST',
                calldatatype: 'JSON',
                isAsync: false,
                headers:
                    {
                        "Accept": "application/json;odata=verbose",
                        "Content-Type": "application/json; odata=verbose",
                        "X-RequestDigest": data.d.GetContextWebInformation.FormDigestValue
                    },
                sucesscallbackfunction: function (data) {
                    allButtons = data.d.results;
                    GetButtonsByRole(id, currentUserRole, formStatus);
                }
            });
        // $.ajax({
        //     url: "https://bajajelect.sharepoint.com/sites/WFRootDev" + "/_api/web/lists/getbytitle('" + ListNames.BUTTONLIST  + "')/GetItems(query=@v1)?@v1={\"ViewXml\":\"<View><Query><Where><And><Eq><FieldRef Name='ApplicationName' /><Value Type='TaxonomyFieldType'>" + CommonConstant.FORMNAME + "</Value></Eq><Eq><FieldRef Name='FormName' /><Value Type='Text'>" + CommonConstant.APPLICATIONNAME + "</Value></Eq></And></Where></Query></View>\"}",
        //     type: "POST",
        //     headers:
        //         {
        //             "Accept": "application/json;odata=verbose",
        //             "Content-Type": "application/json; odata=verbose",
        //             "X-RequestDigest": data.d.GetContextWebInformation.FormDigestValue
        //         },
        //     success: function (data) {
        //         allButtons = data.d.results;
        //         GetButtonsByRole(id, currentUserRole, formStatus);
        //     },
        //     error: function (data) {
        //         console.log(data.responseJSON.error);
        //     }
        // });
    });
}
function GetButtonsByRole(id, currentUserRole, formStatus) {
    var btnli = "";
    var buttonCount = 1;

    // if (id > 0 && id != null) {
    //     formStatus = mainListData.Status
    // }
    // else {
    //     formStatus = "New";
    // }

    currentRoleButtons = [];
    for (i = 0; i <= allButtons.length - 1; i++) {
        if (allButtons[i].FormName.results[0].Label == CommonConstant.FORMNAME && allButtons[i].Role.includes(currentUserRole) && allButtons[i].FormStatus.includes(formStatus)) {
            currentRoleButtons.push(allButtons[i]);
        }
    }

    for (i = 0; i <= currentRoleButtons.length - 1; i++) {
        var jsFuncName = Object.keys(JsFunctionValue).find(k => JsFunctionValue[k] === currentRoleButtons[i].JsFunctionNameId);
        var jsFunc = "onClick=" + jsFuncName + "(this);";
        var dataactionid = ButtonActionStatus[Object.keys(ButtonActionStatus).find(k => ButtonActionStatus[k] === currentRoleButtons[i].ButtonActionValueId)];
        var status = Object.keys(ButtonActionStatus).find(k => ButtonActionStatus[k] === currentRoleButtons[i].ButtonActionValueId);
        var isVisible = currentRoleButtons[i].IsVisible ? "" : "class=hide";
        btnli = btnli + '<li class="pull-left"><a id="btn' + (buttonCount++) + '" ' + isVisible + ' onClick="' + CommonConstant.APPLICATIONSHORTNAME + '_SaveData(this);"' + ' data-action="' + dataactionid + '" data-sendbackto="' + currentRoleButtons[i].SendBackTo + '" data-sendtorole="' + currentRoleButtons[i].SendToRole + '" class="btn btn-default" title="' + currentRoleButtons[i].ToolTip + '" data-placement="bottom"><i class="' + currentRoleButtons[i].Icon + '"></i>&nbsp;' + currentRoleButtons[i].Title + '</a></li>'
    }


    btnli = btnli + '<li class="pull-left"><a id="btnExit" class="btn btn-default" onclick="Exit(this);" title="Exit without saving any data"  data-placement="bottom"><i class="fa fa-sign-out"></i>&nbsp;Home</a></li>';

    $('#dynamicButtonli').html(btnli);
    HideWaitDialog();
}

