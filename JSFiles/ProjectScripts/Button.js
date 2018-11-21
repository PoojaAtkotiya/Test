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