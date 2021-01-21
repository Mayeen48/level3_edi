var electron = require('electron').remote;
// var $ = jQuery = require('jquery');
var PropertiesReader = require('properties-reader');
var window = electron.getCurrentWindow();
var request = require('request');
// var FormData = require('form-data');
var fs = require('fs');
var path = require('path');
var FileSaver = require('file-saver');
var { shell } = require('electron');
var schedule = require('node-schedule');
var axios = require('axios');
// var axios = require('axios');
// var path = require('path')
// var $ = jQuery = require('jquery');
// require('datatables.net')();

// var properties = PropertiesReader('properties.file');
try {
    var properties = PropertiesReader('properties.file');
} catch (err) {
    // alert("Please add properties.file in root directory")
    alert("properties.fileが見つかりません。実行フォルダに配置してください。")
    window.close();
    console.log(err.message);
}
var trigger_execution_time_var = (properties.get('trigger_execution_time'));
if ($.isNumeric(trigger_execution_time_var)) {
    var trigger_execution_time = trigger_execution_time_var * 1000;
} else {
    var trigger_execution_time = 60 * 1000;
}

$(document).ready(function() {
    // var j = schedule.scheduleJob('51 8 * * *', function() {
    //     console.log('The answer to life, the universe, and everything!');
    // });
    // test 
    // var time_array = new Array();
    // $('input[id="time"]').each(function() {
    //     var time = (this.value);
    //     if (time == '') {
    //         time_array.push(['00:00:00']);
    //     } else {
    //         time_array.push([time]);
    //     }
    // });
    // console.log(time_array)
    //     // test 
    // var rule = new schedule.RecurrenceRule();
    // // rule.dayOfWeek = [0, 1, 2, new schedule.Range(4, 6)];
    // rule.hour = [9, 10];
    // rule.minute = [59, 1];

    // var j = schedule.scheduleJob(rule, function() {
    //     // service1Process();
    //     console.log('Today is recognized by Rebecca Black!');
    // });

    // console.log(trigger_execution_time);
    user_login();
    // Path Execute every 1 min
    // setInterval(pathExecute, 3000);
    // setInterval(pathExecuteAll, 10000);
    // Service1 Process with time match 
    setInterval(trigger, trigger_execution_time);
    // setInterval(trigger, trigger_execution_time, 1, 0);
    // setInterval(time_match, trigger_execution_time);
    // setInterval(service2Process, trigger_execution_time);
    // setInterval(service3Process, trigger_execution_time);
    // setInterval(service4Process, trigger_execution_time);
    // setInterval(service5Process, trigger_execution_time);
    // setInterval(service6Process, trigger_execution_time);
    // Service_info_table execute logo change 
    // setInterval(executionNormal, 5000);
    // Text file read success function 
    // read_text_file('test.txt').then(function(data) {

    // })

    $(function() {
        $("#tabs").tabs({ active: 0 });
    });
    $(function() {
        $("#tabs2").tabs({ active: 0 });
    });
    $(function() {
        $("#tabs-popup").tabs({ active: 0 });
    });
    $(function() {
        $("#tabs-popup-cover").tabs({ active: 0 });
    });



    // Calendar declare script 
    var calendar = $('#calendar').fullCalendar({
        editable: true,
        locale: 'ja',
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        dayRender: function(date, cell) {
            var start = $.fullCalendar.formatDate(date, "Y-MM-DD");
            var date = new Date(start)
            if (date.getDay() == 6 || date.getDay() == 0) {
                cell.css("background-color", "red");
            }

        },
        // events: 'calendarload',
        eventRender: function(event, element, view) {
            // event.start is already a moment.js object
            // we can apply .format()
            var dateString = event.start.format("YYYY-MM-DD");
            $(view.el).find('.fc-day[data-date=' + dateString + ']').css('background-color', 'red');
        },
        selectable: true,
        selectHelper: true,
        // select
        select: function(start, end, allDay) {
            var start = $.fullCalendar.formatDate(start, "Y-MM-DD");
            var end = $.fullCalendar.formatDate(end, "Y-MM-DD");
            var enddt = new Date(end);
            enddt.setDate(enddt.getDate() - 1);

            var d = ("0" + enddt.getDate()).slice(-2);
            var m = ("0" + (enddt.getMonth() + 1)).slice(-2);
            var y = enddt.getFullYear();
            var ddd = y + "-" + m + "-" + d;

            $("#calander_message").html('');
            $("#title").val('');
            $('#startDate').val(start);
            $('#endDate').val(ddd);
            $('#endDate').datepicker({ format: 'yyyy-mm-dd' });
            $('#startDate').datepicker({ format: 'yyyy-mm-dd' });
            $("#myModal").modal("show");


        },
    });
    // Calendar declare script end
    // schedule_modal
    // $('.schedule_time').on('click', function() {
    //     $('#rpa_schedule_message').html('');
    //     $('.loader').removeClass('d-none');
    //     $('.loader').addClass('d-block');

    //     // console.log(rpa_schedule_show());
    //     // date_specification_show()
    //     // createModalWindow();
    //     rpa_schedule_show("modal_show");
    //     console.log(status);
    //     // $('#schedule_modal').modal('show');

    // })

    // Row add in schedule 
    $(document).on('click', '#add_new_row', function() {
        var no_data_rows_numbers = $("#week_data tbody").find('input[id="no_data"]').length;
        if (no_data_rows_numbers == 1) {
            $("#week_data tbody").find('input[id="no_data"]').parents("tr").hide();
        }

        var rows_number = $("#week_data tbody").find('input[name="record"]').length;
        var row = '';
        row += '<tr>';
        row += '<td><input class="form-control" type="checkbox" name="record"></td>';
        row += '<td>' + (rows_number + 1) + '</td>';
        row += '<td><input type="time" id="time" value="00:00:00"></td>';
        row += '<td><input class="form-control" type="checkbox" id="sun"></td>';
        row += '<td><input class="form-control" type="checkbox" id="mon"></td>';
        row += '<td><input class="form-control" type="checkbox" id="tue"></td>';
        row += '<td><input class="form-control" type="checkbox" id="wed"></td>';
        row += '<td><input class="form-control" type="checkbox" id="thu"></td>';
        row += '<td><input class="form-control" type="checkbox" id="fri"></td>';
        row += '<td><input class="form-control" type="checkbox" id="sat"></td>';
        row += '<tr>';
        $('#week_data tr:last').after(row);
    });
    // delete row from schedule 
    $("#delete_row").on('click', function() {
        $("#week_data tbody").find('input[name="record"]').each(function() {
            if ($(this).is(":checked")) {
                $(this).parents("tr").remove();
                $('#no_data').val(1);
            }
        });
        var remain_tr = $("#week_data tbody").find('input[name="record"]');
        var rowCount = remain_tr.length;
        if (rowCount == 0) {
            $('#week_data tbody').html('<tr><td colspan="10"><input type="hidden" id="no_data" value="0">データ無し</td></tr>');
        } else {
            for (var row = 0; row < rowCount; row++) {
                $(remain_tr[row]).parents("tr").find("td:eq(1)").html((row + 1));
            }
        }
    });
    // Add Customer modal
    $(document).on('click', '#add_customer', function() {
        $('#add_customer_message').html('');
        $('#new_customer_create').html('保存');
        $('#customer_delete').removeClass('d-block');
        $('#customer_delete').addClass('d-none');
        $("#customer_update_id").val('');
        $("#customer_name").val('');
        $("#partner_code").val('');
        $("#add_customer_modal").modal("show");
    });
    // Edit customer form
    // $(document).on('click', '#customer_edit_form', function() {
    //     $('#add_customer_message').html('');
    //     $('#new_customer_create').html('更新');
    //     $('#customer_delete').removeClass('d-none');
    //     $('#customer_delete').addClass('d-block');
    //     var customer_id = $(this).closest("tr").attr('id');
    //     var customer_name = $(this).closest("tr").attr('cust-name');
    //     var partner_code = $(this).closest("tr").attr('partner-code');

    //     $("#customer_update_id").val(customer_id);
    //     $("#customer_name").val(customer_name);
    //     $("#partner_code").val(partner_code);

    //     // console.log(customer_id);
    //     $("#add_customer_modal").modal("show");
    // });
    // Delete customer 
    // $(document).on('click', '#customer_delete', function() {
    //     var customer_id = $("#customer_update_id").val();
    //     var delete_customer_url = properties.get('delete_customer_url');
    //     var body_data = { customer_id: customer_id }

    //     var apiDataFunc = requestUrl(delete_customer_url, body_data);
    //     apiDataFunc.then(res => res.json())
    //         .then(
    //             json => {
    //                 // console.log(json);
    //                 if (json.status_code == 200) {
    //                     alertMessageClassRemove(json.class_name, json.message, 'alert-danger');
    //                     $("#add_customer_modal").modal("hide");
    //                     $('#' + customer_id).remove();
    //                     var rows = $('#customer_info_table >tbody >tr');
    //                     var rowCount = rows.length;
    //                     for (var row = 0; row < rowCount; row++) {
    //                         $(rows[row]).find("td:eq(0)").html((row + 1));
    //                     }
    //                     $('.cust_info_row.bg-secondary').removeClass("bg-secondary text-white");

    //                     var customer_id_new = $("#customer_info_table>tbody>tr:first").attr('id');
    //                     var customer_name_new = $("#customer_info_table>tbody>tr:first").attr('cust-name');
    //                     var partner_code_new = $("#customer_info_table>tbody>tr:first").attr('partner-code');
    //                     $('#customer_name_view').html(customer_name_new);
    //                     $('#partner_code_view').html(partner_code_new);
    //                     $('#customer_id_for_schedule').val(customer_id_new);
    //                     $('#' + customer_id_new).addClass('bg-secondary text-white');
    //                     // rpa_schedule_show(customer_id_new);
    //                     serviceNameShow(customer_id_new)
    //                 }
    //             }).catch(function(err) {
    //             alert("接続用API設定を確認してください");
    //         });
    // });

    // Row add in schedule 
    $(document).on('click', '#add_new_date_row', function() {
        var no_data_rows_numbers = $("#date_specification_table tbody").find('input[id="no_data_sp"]').length;
        if (no_data_rows_numbers == 1) {
            $("#date_specification_table tbody").find('input[id="no_data_sp"]').parents("tr").hide();
        }

        var rows_number = $("#date_specification_table tbody").find('input[name="rrrr"]').length;
        var row = '';
        row += '<tr>';
        row += '<td><input class="form-control" type="checkbox" name="rrrr"></td>';
        row += '<td>' + (rows_number + 1) + '</td>';
        row += '<td><input type="time" id="time_sp" value="12:00:00" required></td>';
        row += '<td><input class="form-control" type="checkbox" id="last_day"></td>';
        row += '<td><input type="number" id="day" style="width:50px;" value="0" ></td>';
        row += '<tr>';
        $('#date_specification_table tr:last').after(row);
    });
    // delete row from schedule 
    $("#delete_date_row").on('click', function() {
        $("#date_specification_table tbody").find('input[name="rrrr"]').each(function() {
            if ($(this).is(":checked")) {
                $(this).parents("tr").remove();
                $('#no_data_sp').val(1);
            }
        });
        var remain_tr_sp = $("#date_specification_table tbody").find('input[name="rrrr"]');
        var rowCount_sp = remain_tr_sp.length;
        if (rowCount_sp == 0) {
            $('#date_specification_table tbody').html('<tr><td colspan="5"><input type="hidden" id="no_data_sp" value="0">データ無し</td></tr>');
        } else {
            for (var row_sp = 0; row_sp < rowCount_sp; row_sp++) {
                $(remain_tr_sp[row_sp]).parents("tr").find("td:eq(1)").html((row_sp + 1));
            }
        }
    });
    // $("#day").on('keypress', function(e) {
    //     // alert($(this).val());
    //     console.log(e);
    //     console.log("Hi");
    // })
    // Schedule create
    $(document).on('keypress', '#day', function(e) {
        var key_val = $(this).val();
        if (key_val.length > 1) {
            e.preventDefault();
        }
    })

    $(document).on('click', '#schedule_create', function() {
        var time_array = new Array();
        var sun_array = new Array();
        var mon_array = new Array();
        var tue_array = new Array();
        var wed_array = new Array();
        var thu_array = new Array();
        var fri_array = new Array();
        var sat_array = new Array();
        var time_sp_array = new Array();
        var last_day_array = new Array();
        var day_array = new Array();

        var user_id = $('#user_id').val();
        var cmn_connect_id = $('#cmn_connect_id_for_schedule').val();
        var service_id = $('#service_id_popup').val();
        // console.log(service_id);
        // return 0;
        if (cmn_connect_id == 0) {
            scheduleMessageClassRemove('alert-danger', "取引先を選択してください。", 'alert-success');
            return false;
        }
        $('input[id="sun"]').each(function() {
            if ($(this).prop("checked") == true) {
                sun_array.push(1);
            } else if ($(this).prop("checked") == false) {
                sun_array.push(0);
            }
        });
        $('input[id="mon"]').each(function() {
            if ($(this).prop("checked") == true) {
                mon_array.push(1);
            } else if ($(this).prop("checked") == false) {
                mon_array.push(0);
            }
        });
        $('input[id="tue"]').each(function() {
            if ($(this).prop("checked") == true) {
                tue_array.push(1);
            } else if ($(this).prop("checked") == false) {
                tue_array.push(0);
            }
        });
        $('input[id="wed"]').each(function() {
            if ($(this).prop("checked") == true) {
                wed_array.push(1);
            } else if ($(this).prop("checked") == false) {
                wed_array.push(0);
            }
        });
        $('input[id="thu"]').each(function() {
            if ($(this).prop("checked") == true) {
                thu_array.push(1);
            } else if ($(this).prop("checked") == false) {
                thu_array.push(0);
            }
        });
        $('input[id="fri"]').each(function() {
            if ($(this).prop("checked") == true) {
                fri_array.push(1);
            } else if ($(this).prop("checked") == false) {
                fri_array.push(0);
            }
        });
        $('input[id="sat"]').each(function() {
            if ($(this).prop("checked") == true) {
                sat_array.push(1);
            } else if ($(this).prop("checked") == false) {
                sat_array.push(0);
            }
        });
        $('input[id="time"]').each(function() {
            var time = (this.value);
            if (time == '') {
                time_array.push('00:00:00');
            } else {
                time_array.push(time);
            }
        });
        $('input[id="time_sp"]').each(function() {
            var time_sp = (this.value);
            if (time_sp == '') {
                time_sp_array.push('00:00:00');
            } else {
                time_sp_array.push(time_sp);
            }
        });
        $('input[id="last_day"]').each(function() {
            if ($(this).prop("checked") == true) {
                last_day_array.push(1);
            } else if ($(this).prop("checked") == false) {
                last_day_array.push(0);
            }
        });

        $('input[id="day"]').each(function() {
            var day = (this.value);
            if (day == '') {
                day_array.push('0');
            } else {
                day_array.push(day);
            }
        });

        // console.log(sun_array);
        // return 0;
        var no_data = $('#no_data').val();
        if (time_array == '' && no_data == 0) {
            $('#rpa_schedule_message').addClass('alert-danger');
            // $('#rpa_schedule_message').html('Please create at least one row');
            $('#rpa_schedule_message').html('少なくとも1行作成してください。');
            return 0;
        }
        var data_array = [];
        for (var i = 0; i < time_array.length; i++) {
            data_array.push(sun_array[i] + '' + mon_array[i] + '' + tue_array[i] + '' + wed_array[i] + '' + thu_array[i] + '' + fri_array[i] + '' + sat_array[i])
                // console.log(sun_array[i])
        }
        // console.log(data_array)
        // return 0;
        var set_schedule_data_url = properties.get('set_schedule_data_url');
        var url_data = { user_id: user_id, cmn_connect_id: cmn_connect_id, service_id: service_id, data_array: data_array, time_array: time_array, time_sp_array: time_sp_array, last_day_array: last_day_array, day_array: day_array }
            // Api Data 
        axios.post(set_schedule_data_url, url_data).then(({ data }) => {
            $('#rpa_schedule_message').removeClass('alert-danger');
            $('#rpa_schedule_message').addClass(data.class_name);
            $('#rpa_schedule_message').html(data.message);
            rpa_schedule_show(service_id);
        }).catch(() => {
            alert("接続用API設定を確認してください");
        });

    });

    // File download interval

    $("#check_folder_path").on('change', function() {
        try {
            var sourceVal = document.getElementById("check_folder_path").files[0].path;
            $("#check_folder_path_box").val(sourceVal);
        } catch (error) {
            console.log(error)
        }

        // console.log(sourceVal);
    });
    $("#move_folder_path").change(function() {
        try {
            var moveVal = document.getElementById("move_folder_path").files[0].path;
            $("#move_folder_path_box").val(moveVal);
        } catch (error) {
            console.log(error)
        }

        // console.log(moveVal);
    });
    $("#batch_file_path").change(function() {
        try {
            var batchVal = document.getElementById("batch_file_path").files[0].path;
            $("#batch_file_path_box").val(batchVal);
        } catch (error) {
            console.log(error)
        }

        // console.log(moveVal);
    });
    $("#api_folder_path").change(function() {
        try {
            var apiPathVal = document.getElementById("api_folder_path").files[0].path;
            $("#api_folder_path_box").val(apiPathVal);
        } catch (error) {
            console.log(error)
        }

        // console.log(moveVal);
    });
    $('#file_path_save,#api_url_save').on('click', function() {
        var path_execution_flag = $("#path_execution_flag").is(':checked');
        // var shipment_path_execute = $("#shipment_path_execute").is(':checked');
        var user_id = $('#user_id').val();
        var cmn_connect_id = $('#cmn_connect_id_for_schedule').val();;
        var service_id = $('#service_id_popup').val();;
        var file_source_path = $("#check_folder_path_box").val();
        var file_move_path = $("#move_folder_path_box").val();
        var api_url = $("#api_url").val();
        var api_folder_path = $("#api_folder_path_box").val();
        if (file_source_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "Check folder path can not more than 500 character", 'alert-success');
            // console.log("Check folder path can not more than 500 character");
            return false;
        }
        if (file_move_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "Move folder path can not more than 500 character", 'alert-success');
            // console.log("Move folder path can not more than 500 character");
            return false;
        }
        if (api_url.length > 500) {
            scheduleMessageClassRemove('alert-danger', "API can not more than 500 character", 'alert-success');
            // console.log("API can not more than 500 character");
            return false;
        }
        if (api_folder_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "API folder path can not more than 500 character", 'alert-success');
            // console.log("API folder path can not more than 500 character");
            return false;
        }

        var url_data = { user_id: user_id, cmn_connect_id: cmn_connect_id, service_id: service_id, path_execution_flag: path_execution_flag, file_source_path: file_source_path, file_move_path: file_move_path, api_url: api_url, api_folder_path: api_folder_path }
        var set_file_path_url = properties.get('set_file_path');
        axios.post(set_file_path_url, url_data).then(({ data }) => {
            scheduleMessageClassRemove(data.class_name, data.message, 'alert-danger')
            rpa_schedule_show(service_id);
        }).catch(() => {
            console.log("接続用API設定を確認してください");
        });
    });

    $(document).on('click', '#next_service_save, #job_save', function() {
        // alert("OK");
        var job_execution_flag = $("#job_execution_flag").is(':checked');
        var scenario_execute = $("#scenario_execute").is(':checked');
        var batch_execute = $("#batch_execute").is(':checked');
        // var api_path = $("#api_path").val();
        var cmn_scenario_id = $("#cmn_scenario_id").val();
        var batch_file_path = $("#batch_file_path_box").val();
        var service_id = $('#service_id_popup').val();
        var job_update_id = $('#job_update_id').val();
        var next_service_id = $('#next_service').find(":selected").val();
        // var next_service_id = $('#next_service').selected().val();
        // console.log(next_service_id);
        // return 0;
        // if (api_path.length > 500) {
        //     scheduleMessageClassRemove('alert-danger', "API can not more than 500 character", 'alert-success');
        //     // console.log("API can not more than 500 character");
        //     return false;
        // }
        if (batch_file_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "Batch file path can not more than 500 character", 'alert-success');
            // console.log("Batch file path can not more than 500 character");
            return false;
        }

        var execution = '';
        if (scenario_execute) {
            execution = 'scenario';
        } else if (batch_execute) {
            execution = 'batch';
        } else {
            execution = 'batch';
        }
        if (execution == "scenario" && cmn_scenario_id == null) {
            scheduleMessageClassRemove('alert-danger', "Scenario list empty", 'alert-success');
        }
        var set_job_data_url = properties.get('set_job_data_url');
        body_data = { service_id: service_id, job_update_id: job_update_id, cmn_scenario_id: cmn_scenario_id, batch_file_path: batch_file_path, execution: execution, job_execution_flag: job_execution_flag, next_service_id: next_service_id }
        axios.post(set_job_data_url, body_data).then(({ data }) => {
            if (data.status_code == 200) {
                scheduleMessageClassRemove(data.class_name, data.message, 'alert-danger')
                rpa_schedule_show(service_id);
            }
        }).catch(() => {
            alert("接続用API設定を確認してください");
        });

    })
    $(document).on('click', '.cust_info_row', function() {
        var cmn_connect_id = $(this).attr("cmn_connect_id");
        var adm_user_id = $(this).attr("adm_user_id");
        var partner_code = $(this).attr("partner-code");
        var company_name = $(this).attr("company-name");
        $('#company_name_view').html(company_name);
        $('#partner_code_view').html(partner_code);
        $('#cmn_connect_id_for_schedule').val(cmn_connect_id);
        $('.cust_info_row.bg-secondary').removeClass("bg-secondary text-white");
        $(this).addClass('bg-secondary text-white');
        $('#alert_message').html('');
        serviceNameShow({ cmn_connect_id: cmn_connect_id, adm_user_id: adm_user_id })
            // var customer_id = $("#customer_info_table>tbody>tr:first").attr('id');
            // rpa_schedule_show(service_id);
    });
    $("#area_refresh,#sub_area_refresh").on('click', function() {
        areRefresh();
    });

    $(document).on('click', '#add_service', function() {
        $('#add_service_message').html('');
        $('#new_service_create').html('保存');
        $('#service_delete').removeClass('d-block');
        $('#service_delete').addClass('d-none');
        $("#service_update_id").val('');
        $("#service_name").val('');
        $("#add_service_modal").modal("show");
    });

    $(document).on('click', '#new_service_create', function() {

        var service_id = $("#service_update_id").val();
        var service_name = $("#service_name").val();
        var cmn_connect_id = $('#cmn_connect_id_for_schedule').val();
        var service_name_len = service_name.length;
        // console.log(customer_id);
        // return 0;
        var user_id = $('#user_id').val();
        if (service_name == '') {
            $('#add_service_message').addClass('alert-danger');
            $('#add_service_message').html('サービス名を入力してください。');
            return 0;
        }
        if (service_name_len > 50) {
            $('#add_service_message').addClass('alert-danger');
            $('#add_service_message').html('Service name must be less than 50 character');
            return 0;
        }
        var add_service_url = properties.get('add_service_url');
        var body = { user_id: user_id, cmn_connect_id: cmn_connect_id, service_id: service_id, service_name: service_name }
        var serviceApiData = axios.post(add_service_url, body);
        serviceApiData.then(({ data }) => {
            console.log(data);
            var response = data;
            $('#add_service_message').removeClass('alert-danger');
            $('#add_service_message').addClass(data.class_name);
            $('#add_service_message').html(data.message);
            if (data.flag == 0) {
                if (data.status_code == 200) {
                    $('.service_info_row.bg-secondary').removeClass("bg-secondary text-white");
                    // $('#add_customer_form')[0].reset();
                    var rows_numbers = $("#service_info_table tbody tr").length;
                    var rows_0_val = $("#service_info_table tbody tr:eq(0)").attr('remove_val');
                    if (rows_0_val == 1) {
                        $("#service_info_table tbody tr:eq(0)").remove();
                        rows_numbers = rows_numbers;
                    } else {
                        rows_numbers = rows_numbers + 1;
                    }
                    var raw_html = '';
                    raw_html += '<tr class="service_info_row remove_val="0" bg-secondary text-white" service-id="' + data.lst_service_id + '" service-name="' + service_name + '">';
                    raw_html += '<td>' + (rows_numbers) + '</td>';
                    raw_html += '<td id="service_edit_form">' + service_name + '</td>';
                    raw_html += '<td style="text-align:center;" id="service_execution"><i class="far fa-play-circle" style="font-size:30px;"></i></td>';
                    raw_html += '<td style="text-align:center;" id="service_configureation"><i class="fas fa-cog" style="font-size:30px;"></i></td>';
                    raw_html += '</tr>';
                    $('#service_info_table tbody').append(raw_html);
                    alertMessageClassRemove(data.class_name, data.message, 'alert-danger');
                    $("#add_service_modal").modal("hide");
                    // rpa_schedule_show(data.lst_service_id);
                }

            } else if (data.flag == 1) {
                if (data.status_code == 200) {
                    var clicked_row = $("#clicked_row_number").val();
                    // $('#service_info_table tr:eq(1)').find("td:eq(1)").text(service_name);
                    $('#service_info_table tbody tr:eq(' + (clicked_row) + ')').find("td:eq(1)").text(service_name);
                    $('#service_info_table tbody tr:eq(' + (clicked_row) + ')').attr('service-name', service_name);

                    alertMessageClassRemove(data.class_name, data.message, 'alert-danger');
                    $("#add_service_modal").modal("hide");
                }
            }

        }).catch(() => {
            alert("接続用API設定を確認してください");
        });
    });

    $(document).on('click', '.service_info_row', function() {
        var service_id = $(this).attr('service-id');
        // console.log(service_id);
        rpa_schedule_show(service_id);
        $('.service_info_row.bg-secondary').removeClass("bg-secondary text-white");
        $(this).addClass('bg-secondary text-white');
        $('#alert_message').html('');

    });

    $(document).on('click', '#service_edit_form', function() {
        // var row_number = $(this).index();
        var closest_tr = $(this).closest('tr');
        var row_number = closest_tr.index();
        // console.log(row_number);
        var service_info_id = closest_tr.attr("service-id");
        var service_name = closest_tr.attr("service-name");
        $('#alert_message').html('');
        $('#add_service_message').html('');
        $('#new_service_create').html('更新');
        $('#service_delete').removeClass('d-none');
        $('#service_delete').addClass('d-block');
        $("#service_update_id").val(service_info_id);
        $("#service_name").val(service_name);
        $("#clicked_row_number").val(row_number);
        $("#add_service_modal").modal("show");
    })
    $(document).on('click', '#service_delete', function() {
        var service_id = $("#service_update_id").val();
        var clicked_row = $("#clicked_row_number").val();

        var delete_service_url = properties.get('delete_service_url');
        var body_data = { service_id: service_id }
        axios.post(delete_service_url, body_data).then(({ data }) => {
            // console.log(data);
            if (data.status_code == 200) {
                $('#alert_message').html(data.message);
                $('#alert_message').addClass(data.class_name);
                $("#add_service_modal").modal("hide");
                $('#service_info_table tbody tr:eq(' + (clicked_row) + ')').remove();
                // $('#' + customer_id).remove();
                var rows = $('#service_info_table >tbody >tr');
                var rowCount = rows.length;
                for (var row = 0; row < rowCount; row++) {
                    $(rows[row]).find("td:eq(0)").html((row + 1));
                }
                $('.service_info_row.bg-secondary').removeClass("bg-secondary text-white");

                // var customer_id_new = $("#customer_info_table>tbody>tr:first").attr('id');
                // var customer_name_new = $("#customer_info_table>tbody>tr:first").attr('cust-name');
                // var partner_code_new = $("#customer_info_table>tbody>tr:first").attr('partner-code');
                // $('#customer_name_view').html(customer_name_new);
                // $('#partner_code_view').html(partner_code_new);
                // $('#customer_id_for_schedule').val(customer_id_new);
                // $('#' + customer_id_new).addClass('bg-secondary text-white');
                // rpa_schedule_show(customer_id_new);
            }
        }).catch(function(err) {
            alert("接続用API設定を確認してください");
        });
    });


    $(document).on('click', '#service_configureation', function() {
        // $(this).closest('tr').unbind('click');
        var service_id = $(this).closest('tr').attr('service-id');
        // console.log(service_id);
        // return 0;
        $('#service_id_popup').val(service_id);
        rpa_schedule_show(service_id);
        $("#schedule_modal").modal("show");
        scheduleMessageClassRemove('', '', 'alert-success')
        scheduleMessageClassRemove('', '', 'alert-danger')
    });
    $(document).on('click', '#service_execution', function() {
        var closest_tr = $(this).closest('tr');
        var row_number = closest_tr.index();
        var service_id = closest_tr.attr("service-id");
        trigger(service_id, row_number);
        // if (row_number == 0) {
        //     service1Process(service_id, process_type = "Manual");
        // } else if (row_number == 1) {
        //     service2Process(service_id, process_type = "Manual")
        // } else if (row_number == 2) {
        //     service3Process(service_id, process_type = "Manual")
        // } else if (row_number == 3) {
        //     service4Process(service_id, process_type = "Manual")
        // } else if (row_number == 4) {
        //     service5Process(service_id, process_type = "Manual")
        // } else if (row_number == 5) {
        //     service6Process(service_id, process_type = "Manual")
        // } else {
        //     console.log("Clicked button not configured");
        // }
    });
    $(document).on('click', '.history_message', function() {
        var history_message = $(this).attr('hist_message');
        if (history_message == null) {
            history_message = "No message found.";
        }
        $('.history_message').removeClass("bg-secondary text-white");
        $(this).addClass("bg-secondary text-white");
        $('#h_details').html(history_message);
        $('#history_details_modal').modal("show");
    });
    // downloadPDF(response.file_name, response.file_path)
    // Ending point 
});