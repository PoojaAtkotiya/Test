var masterlistNameArray = [];
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