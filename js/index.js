var electron = require('electron').remote;
var PropertiesReader = require('properties-reader');
var window = electron.getCurrentWindow();
var request = require('request');
var fs = require('fs');
var path = require('path');
var FileSaver = require('file-saver');
var { shell } = require('electron');
var schedule = require('node-schedule');
var axios = require('axios');
const log = require('electron-log');

try {
    var properties = PropertiesReader('properties.file');
    var email = properties.get('user_name');
    var password = properties.get('password');
    var file_log_level = properties.get('file_log_level');
    var console_log_level = properties.get('console_log_level');
    var send_mail_address = properties.get('send_mail_address');
} catch (err) {
    alert("properties.fileが見つかりません。実行フォルダに配置してください。また、内容を確認してください")
    window.close();
    log.error(err.message);
}

log.transports.file.resolvePath = () => 'logs/level3-' + new Date().toISOString().slice(0, 10) + '.log';

log.transports.console.level = console_log_level;   // console log level
log.transports.file.level = file_log_level;         // file log level
log.debug('app start---');




log.catchErrors();
// log.catchErrors({
//     showDialog: false,
//     onError(error, versions, submitIssue) {
//         electron.dialog.showMessageBox({
//                 title: 'An error occurred',
//                 message: error.message,
//                 detail: error.stack,
//                 type: 'error',
//                 buttons: ['Ignore', 'Report', 'Exit'],
//             })
//             .then((result) => {
//                 if (result.response === 1) {
//                     submitIssue('https://github.com/my-acc/my-app/issues/new', {
//                         title: `Error report for ${versions.app}`,
//                         body: 'Error:\n```' + error.stack + '\n```\n' + `OS: ${versions.os}`
//                     });
//                     return;
//                 }

//                 if (result.response === 2) {
//                     electron.app.quit();
//                 }
//             });
//     }
// });
// log.transports.file.getFile();

var trigger_execution_time_var = (properties.get('trigger_execution_time'));
if ($.isNumeric(trigger_execution_time_var)) {
    var trigger_execution_time = trigger_execution_time_var * 1000;
} else {
    var trigger_execution_time = 60 * 1000;
}

var interval_trigger;

$(document).ready(function () {
    // mailsend("test sub","message");

    // ログインチェック
    user_login();

    // service情報取得


    // 自動実行開始
    interval_trigger = setInterval(trigger, trigger_execution_time);

    $(function () {
        $("#tabs").tabs({ active: 0 });
    });
    $(function () {
        $("#tabs2").tabs({ active: 0 });
    });
    $(function () {
        $("#tabs-popup").tabs({ active: 0 });
    });
    $(function () {
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
        dayRender: function (date, cell) {
            var start = $.fullCalendar.formatDate(date, "Y-MM-DD");
            var date = new Date(start)
            if (date.getDay() == 6 || date.getDay() == 0) {
                cell.css("background-color", "red");
            }

        },
        // events: 'calendarload',
        eventRender: function (event, element, view) {
            // event.start is already a moment.js object
            // we can apply .format()
            var dateString = event.start.format("YYYY-MM-DD");
            $(view.el).find('.fc-day[data-date=' + dateString + ']').css('background-color', 'red');
        },
        selectable: true,
        selectHelper: true,
        // select
        select: function (start, end, allDay) {
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

    // 自動実行
    $('#interval_flag').on('click', function () {
        $('#interval_flag:checked').each(function () {
            log.info('schedule start');
            interval_trigger = setInterval(trigger, trigger_execution_time);
            $('#interval_status').text('動作中').removeClass('bg-danger').addClass('bg-info');
        })
        $('#interval_flag:not(:checked)').each(function () {
            log.info('schedule end');
            clearInterval(interval_trigger);
            $('#interval_status').text('停止中').removeClass('bg-info').addClass('bg-danger');
        })
    });


    // Row add in schedule 
    $(document).on('click', '#add_new_row', function () {
        var no_data_rows_numbers = $("#week_data tbody").find('input[id="no_data"]').length;
        if (no_data_rows_numbers == 1) {
            $("#week_data tbody").find('input[id="no_data"]').parents("tr").hide();
        }

        var rows_number = $("#week_data tbody").find('input[name="record"]').length;
        var row = '';
        row += '<tr>';
        row += '<td><input class="" type="checkbox" name="record"></td>';
        row += '<td>' + (rows_number + 1) + '</td>';
        row += '<td><input type="time" id="time" value="00:00:00"></td>';
        row += '<td><input class="" type="checkbox" id="sun"></td>';
        row += '<td><input class="" type="checkbox" id="mon"></td>';
        row += '<td><input class="" type="checkbox" id="tue"></td>';
        row += '<td><input class="" type="checkbox" id="wed"></td>';
        row += '<td><input class="" type="checkbox" id="thu"></td>';
        row += '<td><input class="" type="checkbox" id="fri"></td>';
        row += '<td><input class="" type="checkbox" id="sat"></td>';
        row += '<tr>';
        $('#week_data tr:last').after(row);
    });
    // delete row from schedule 
    $("#delete_row").on('click', function () {
        $("#week_data tbody").find('input[name="record"]').each(function () {
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
    $(document).on('click', '#add_customer', function () {
        $('#add_customer_message').html('');
        $('#new_customer_create').html('保存');
        $('#customer_delete').removeClass('d-block');
        $('#customer_delete').addClass('d-none');
        $("#customer_update_id").val('');
        $("#customer_name").val('');
        $("#partner_code").val('');
        $("#add_customer_modal").modal("show");
    });

    // Row add in schedule 
    $(document).on('click', '#add_new_date_row', function () {
        var no_data_rows_numbers = $("#date_specification_table tbody").find('input[id="no_data_sp"]').length;
        if (no_data_rows_numbers == 1) {
            $("#date_specification_table tbody").find('input[id="no_data_sp"]').parents("tr").hide();
        }

        var rows_number = $("#date_specification_table tbody").find('input[name="rrrr"]').length;
        var row = '';
        row += '<tr>';
        row += '<td><input class="" type="checkbox" name="rrrr"></td>';
        row += '<td>' + (rows_number + 1) + '</td>';
        row += '<td><input type="time" id="time_sp" value="12:00:00" required></td>';
        row += '<td><input class="" type="checkbox" id="last_day"></td>';
        row += '<td><input type="number" id="day" style="width:50px;" value="0" ></td>';
        row += '<tr>';
        $('#date_specification_table tr:last').after(row);
    });
    // delete row from schedule 
    $("#delete_date_row").on('click', function () {
        $("#date_specification_table tbody").find('input[name="rrrr"]').each(function () {
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
    // Schedule create
    $(document).on('keypress', '#day', function (e) {
        var key_val = $(this).val();
        if (key_val.length > 1) {
            e.preventDefault();
        }
    })

    $(document).on('click', '#schedule_create', function () {
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
        if (cmn_connect_id == 0) {
            scheduleMessageClassRemove('alert-danger', "取引先を選択してください。", 'alert-success');
            return false;
        }
        $('input[id="sun"]').each(function () {
            if ($(this).prop("checked") == true) {
                sun_array.push(1);
            } else if ($(this).prop("checked") == false) {
                sun_array.push(0);
            }
        });
        $('input[id="mon"]').each(function () {
            if ($(this).prop("checked") == true) {
                mon_array.push(1);
            } else if ($(this).prop("checked") == false) {
                mon_array.push(0);
            }
        });
        $('input[id="tue"]').each(function () {
            if ($(this).prop("checked") == true) {
                tue_array.push(1);
            } else if ($(this).prop("checked") == false) {
                tue_array.push(0);
            }
        });
        $('input[id="wed"]').each(function () {
            if ($(this).prop("checked") == true) {
                wed_array.push(1);
            } else if ($(this).prop("checked") == false) {
                wed_array.push(0);
            }
        });
        $('input[id="thu"]').each(function () {
            if ($(this).prop("checked") == true) {
                thu_array.push(1);
            } else if ($(this).prop("checked") == false) {
                thu_array.push(0);
            }
        });
        $('input[id="fri"]').each(function () {
            if ($(this).prop("checked") == true) {
                fri_array.push(1);
            } else if ($(this).prop("checked") == false) {
                fri_array.push(0);
            }
        });
        $('input[id="sat"]').each(function () {
            if ($(this).prop("checked") == true) {
                sat_array.push(1);
            } else if ($(this).prop("checked") == false) {
                sat_array.push(0);
            }
        });
        $('input[id="time"]').each(function () {
            var time = (this.value);
            if (time == '') {
                time_array.push('00:00:00');
            } else {
                time_array.push(time);
            }
        });
        $('input[id="time_sp"]').each(function () {
            var time_sp = (this.value);
            if (time_sp == '') {
                time_sp_array.push('00:00:00');
            } else {
                time_sp_array.push(time_sp);
            }
        });
        $('input[id="last_day"]').each(function () {
            if ($(this).prop("checked") == true) {
                last_day_array.push(1);
            } else if ($(this).prop("checked") == false) {
                last_day_array.push(0);
            }
        });

        $('input[id="day"]').each(function () {
            var day = (this.value);
            if (day == '') {
                day_array.push('0');
            } else {
                day_array.push(day);
            }
        });
        var no_data = $('#no_data').val();
        if (time_array == '' && no_data == 0) {
            $('#rpa_schedule_message').addClass('alert-danger');
            $('#rpa_schedule_message').html('少なくとも1行作成してください。');
            return 0;
        }
        var data_array = [];
        for (var i = 0; i < time_array.length; i++) {
            data_array.push(sun_array[i] + '' + mon_array[i] + '' + tue_array[i] + '' + wed_array[i] + '' + thu_array[i] + '' + fri_array[i] + '' + sat_array[i])
        }
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

    $("#check_folder_path").on('change', function () {
        try {
            var sourceVal = document.getElementById("check_folder_path").files[0].path;
            $("#check_folder_path_box").val(sourceVal);
        } catch (error) {
            log.info(error)
        }
    });
    $("#move_folder_path").change(function () {
        try {
            var moveVal = document.getElementById("move_folder_path").files[0].path;
            $("#move_folder_path_box").val(moveVal);
        } catch (error) {
            log.info(error)
        }
    });
    $("#batch_file_path").change(function () {
        try {
            var batchVal = document.getElementById("batch_file_path").files[0].path;
            $("#batch_file_path_box").val(batchVal);
        } catch (error) {
            log.info(error)
        }
    });
    $("#api_folder_path").change(function () {
        try {
            var apiPathVal = document.getElementById("api_folder_path").files[0].path;
            $("#api_folder_path_box").val(apiPathVal);
        } catch (error) {
            log.info(error)
        }
    });
    $('#file_path_save,#api_url_save').on('click', function () {
        var path_execution_flag = $("#path_execution_flag").is(':checked');
        // var api_execution_flag = $("#api_execution_flag").is(':checked');
        var user_id = $('#user_id').val();
        var cmn_connect_id = $('#cmn_connect_id_for_schedule').val();;
        var service_id = $('#service_id_popup').val();;
        var file_source_path = $("#check_folder_path_box").val();
        var file_move_path = $("#move_folder_path_box").val();
        var api_url = $("#api_url").val();
        var api_folder_path = $("#api_folder_path_box").val();
        if (file_source_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "Check folder path can not more than 500 character", 'alert-success');
            return false;
        }
        if (file_move_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "Move folder path can not more than 500 character", 'alert-success');
            return false;
        }
        if (api_url.length > 500) {
            scheduleMessageClassRemove('alert-danger', "API can not more than 500 character", 'alert-success');
            return false;
        }
        if (api_folder_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "API folder path can not more than 500 character", 'alert-success');
            return false;
        }

        var url_data = { user_id: user_id, cmn_connect_id: cmn_connect_id, service_id: service_id, path_execution_flag: path_execution_flag, file_source_path: file_source_path, file_move_path: file_move_path, api_url: api_url, api_folder_path: api_folder_path }
        var set_file_path_url = properties.get('set_file_path');
        axios.post(set_file_path_url, url_data).then(({ data }) => {
            scheduleMessageClassRemove(data.class_name, data.message, 'alert-danger')
            rpa_schedule_show(service_id);
        }).catch(() => {
            log.info("接続用API設定を確認してください");
        });
    });

    $(document).on('click', '#next_service_save, #job_save', function () {
        var job_execution_flag = $("#job_execution_flag").is(':checked');
        var scenario_execute = $("#scenario_execute").is(':checked');
        var batch_execute = $("#batch_execute").is(':checked');
        var cmn_scenario_id = $("#cmn_scenario_id").val();
        var batch_file_path = $("#batch_file_path_box").val();
        var service_id = $('#service_id_popup').val();
        var job_update_id = $('#job_update_id').val();
        var next_service_id = $('#next_service').find(":selected").val();
        if (batch_file_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "Batch file path can not more than 500 character", 'alert-success');
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
        let body_data = { service_id: service_id, job_update_id: job_update_id, cmn_scenario_id: cmn_scenario_id, batch_file_path: batch_file_path, execution: execution, job_execution_flag: job_execution_flag, next_service_id: next_service_id }
        axios.post(set_job_data_url, body_data).then(({ data }) => {
            if (data.status_code == 200) {
                scheduleMessageClassRemove(data.class_name, data.message, 'alert-danger')
                rpa_schedule_show(service_id);
            }
        }).catch(() => {
            alert("接続用API設定を確認してください");
        });

    })
    $(document).on('click', '.cust_info_row', function () {
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
        serviceNameShow(cmn_connect_id)
    });
    $("#area_refresh,#sub_area_refresh,#first_tab").on('click', function () {
        areRefresh();
    });

    // 削除
    $('#service_delete').on('click', function () {
        var service_id = $('#service_id_popup').val();
        let body_data = { service_id: service_id }
        axios.post(set_job_data_url, body_data).then(({ data }) => {
            if (data.status_code == 200) {
                scheduleMessageClassRemove(data.class_name, data.message, 'alert-danger')
                rpa_schedule_show(service_id);
            }
        }).catch(() => {
            alert("接続用API設定を確認してください");
        });

    });

    $(document).on('click', '#add_service', function () {
        $('#add_service_message').html('');
        $('#new_service_create').html('保存');
        $('#service_delete').removeClass('d-block');
        $('#service_delete').addClass('d-none');
        $("#service_update_id").val('');
        $("#service_name").val('');
        $("#add_service_modal").modal("show");
    });

    $(document).on('click', '#new_service_create', function () {

        var service_id = $("#service_update_id").val();
        var service_name = $("#service_name").val();
        var cmn_connect_id = $('#cmn_connect_id_for_schedule').val();
        var service_name_len = service_name.length;
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
            $('#add_service_message').removeClass('alert-danger');
            $('#add_service_message').addClass(data.class_name);
            $('#add_service_message').html(data.message);
            if (data.flag == 0) {
                if (data.status_code == 200) {
                    $('.service_info_row.bg-secondary').removeClass("bg-secondary text-white");
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
                    customerInfo(user_id)
                    $("#add_service_modal").modal("hide");
                }

            } else if (data.flag == 1) {
                if (data.status_code == 200) {
                    var clicked_row = $("#clicked_row_number").val();
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

    $(document).on('click', '.service_info_row', function () {
        var service_id = $(this).attr('service-id');
        rpa_schedule_show(service_id);
        $('.service_info_row.bg-secondary').removeClass("bg-secondary text-white");
        $(this).addClass('bg-secondary text-white');
        $('#alert_message').html('');

    });

    $(document).on('click', '#service_edit_form', function () {
        var closest_tr = $(this).closest('tr');
        var row_number = closest_tr.index();
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
    $(document).on('click', '#service_delete', function () {
        var service_id = $("#service_update_id").val();
        var clicked_row = $("#clicked_row_number").val();

        var delete_service_url = properties.get('delete_service_url');
        var body_data = { service_id: service_id }
        axios.post(delete_service_url, body_data).then(({ data }) => {
            if (data.status_code == 200) {
                $('#alert_message').html(data.message);
                $('#alert_message').addClass(data.class_name);
                $("#add_service_modal").modal("hide");
                $('#service_info_table tbody tr:eq(' + (clicked_row) + ')').remove();
                var rows = $('#service_info_table >tbody >tr');
                var rowCount = rows.length;
                for (var row = 0; row < rowCount; row++) {
                    $(rows[row]).find("td:eq(0)").html((row + 1));
                }
                $('.service_info_row.bg-secondary').removeClass("bg-secondary text-white");
            }
        }).catch(function (err) {
            alert("接続用API設定を確認してください");
        });
    });


    $(document).on('click', '#service_configureation', function () {
        var service_id = $(this).closest('tr').attr('service-id');
        $('#service_id_for_job_exec_trigger').val(service_id);
        $('#service_id_popup').val(service_id);
        rpa_schedule_show(service_id);
        $("#schedule_modal").modal("show");
        scheduleMessageClassRemove('', '', 'alert-success')
        scheduleMessageClassRemove('', '', 'alert-danger')
    });
    $(document).on('click', '#service_execution', function () {
        var closest_tr = $(this).closest('tr');
        var row_number = closest_tr.index();
        var service_id = closest_tr.attr("service-id");
        trigger(service_id, row_number);
    });
    $(document).on('click', '.history_message', function () {
        var history_message = $(this).attr('hist_message');
        if (history_message == null) {
            history_message = "No message found.";
        }
        $('.history_message').removeClass("bg-secondary text-white");
        $(this).addClass("bg-secondary text-white");
        $('#h_details').html(history_message);
        $('#history_details_modal').modal("show");
    });
    // Ending point 
});