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
    var max_log_file_size = properties.get('max_log_file_size');

} catch (err) {
    alert("properties.fileが見つかりません。実行フォルダに配置してください。また、内容を確認してください")
    window.close();
    log.error(err.message);
}
log.transports.file.resolvePath = () => 'logs/level3-' + new Date().toISOString().slice(0, 10) + '.log';
// log.transports.file.format = '{h}:{i}:{s} {text}';

log.transports.console.level = console_log_level; // console log level
log.transports.file.level = file_log_level; // file log level
log.transports.file.maxSize = max_log_file_size;
// log.transports.file.maxSize = 1024 * 1000;
log.debug('app start---');




log.catchErrors();

var trigger_execution_time_var = (properties.get('trigger_execution_time'));
if ($.isNumeric(trigger_execution_time_var)) {
    var trigger_execution_time = trigger_execution_time_var * 1000;
} else {
    var trigger_execution_time = 60 * 1000;
}

var interval_trigger;

$(document).ready(function() {
    let base_api_url=properties.get('base_api_url');
    let prefix=properties.get('prefix');
    let api_url=base_api_url+prefix
    // mailsend("test sub","message");
    // mailsend("Biware level3 start", "level3 started");

    // ログインチェック
    user_login();

    // service情報取得


    // 自動実行開始
    interval_trigger = setInterval(trigger, trigger_execution_time);

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

    // 自動実行
    $('#interval_flag').on('click', function() {
        $('#interval_flag:checked').each(function() {
            log.info('schedule start');
            interval_trigger = setInterval(trigger, trigger_execution_time);
            $('#interval_status').text('動作中').removeClass('bg-danger').addClass('bg-info');
        })
        $('#interval_flag:not(:checked)').each(function() {
            log.info('schedule end');
            clearInterval(interval_trigger);
            $('#interval_status').text('停止中').removeClass('bg-info').addClass('bg-danger');
        })
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

    // Row add in schedule 
    $(document).on('click', '#add_new_date_row', function() {
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
    // Schedule create
    $(document).on('keypress', '#day', function(e) {
        var key_val = $(this).val();
        if (key_val.length > 1) {
            e.preventDefault();
        }
    })

    $("#source_dir_path").on('change', function() {
        try {
            var sourceVal = document.getElementById("source_dir_path").files[0].path;
            $("#source_dir_path_input").val(sourceVal);
        } catch (error) {
            log.info(error)
        }
    });
    $("#moved_dir_path").change(function() {
        try {
            var moveVal = document.getElementById("moved_dir_path").files[0].path;
            $("#moved_dir_path_input").val(moveVal);
        } catch (error) {
            log.info(error)
        }
    });
    $("#batch_file_path").change(function() {
        try {
            var batchVal = document.getElementById("batch_file_path").files[0].path;
            $("#batch_file_path_box").val(batchVal);
        } catch (error) {
            log.info(error)
        }
    });
    $("#api_dir_path").change(function() {
        try {
            var apiPathVal = document.getElementById("api_dir_path").files[0].path;
            $("#api_dir_path_input").val(apiPathVal);
        } catch (error) {
            log.info(error)
        }
    });
    $('#file_path_save,#api_url_save').on('click', function() {
        var edi_retail_company_id = $("#company_id_view_hidden").val();
        var path_execution_flag = $("#path_execution_flag").is(':checked');
        var api_execution_flag = $("#api_execution_flag").is(':checked');
        var user_id = $('#user_id').val();
        var service_id = $('#service_id_popup').val();;
        var source_dir_path = $("#source_dir_path_input").val();
        var moved_dir_path = $("#moved_dir_path_input").val();
        var api_url_input = $("#api_url").val();
        var api_dir_path = $("#api_dir_path_input").val();
        if (!edi_retail_company_id) {
            scheduleMessageClassRemove('alert-danger', "No company ID found", 'alert-success');
            return false;
        }
        if (source_dir_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "Check folder path can not more than 500 character", 'alert-success');
            return false;
        }
        if (moved_dir_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "Move folder path can not more than 500 character", 'alert-success');
            return false;
        }
        if (api_url_input.length > 500) {
            scheduleMessageClassRemove('alert-danger', "API can not less than 0 and more than 500 character", 'alert-success');
            return false;
        }
        if (api_dir_path.length > 500) {
            scheduleMessageClassRemove('alert-danger', "API folder path can not less than 0 and more than 500 character", 'alert-success');
            return false;
        }
        var formData= new FormData()
        formData.append('service_id',service_id)

        formData.append('company_id',edi_retail_company_id)
        formData.append('path_execution_flag',path_execution_flag)
        formData.append('source_dir_path',source_dir_path)
        formData.append('moved_dir_path',moved_dir_path)
        formData.append('api_execution_flag',api_execution_flag)
        formData.append('api_url',api_url_input)
        formData.append('api_dir_path',api_dir_path)
        formData.append('job_type',"api")

        var save_job = properties.get('save_job');
        axios.post(api_url+save_job, formData).then(({ data }) => {
            if (data.success) {
                alertMessageClassRemove(data.class_name, data.message, 'alert-danger');
                $("#schedule_modal").modal("hide");
                companyInfo(user_id, 1)
            }else{
                scheduleMessageClassRemove(data.class_name, data.message, 'alert-danger')
            }
        }).catch(() => {
            log.info("接続用API設定を確認してください");
            scheduleMessageClassRemove('alert-danger', "接続用API設定を確認してください", 'alert-danger')
        });
    });
    $(document).on('click', '.cust_info_row', function() {
        var edi_retail_company_id = $(this).attr("edi_retail_company_id");
        var adm_user_id = $(this).attr("adm_user_id");
        var company_name = $(this).attr("company-name");
        $('#company_name_view').html(company_name);
        $('#company_id_view').html(edi_retail_company_id);
        $('#company_id_view_hidden').val(edi_retail_company_id);
        $('.cust_info_row.bg-secondary').removeClass("bg-secondary text-white");
        $(this).addClass('bg-secondary text-white');
        $('#alert_message').html('');
        serviceShow(edi_retail_company_id)
    });
    $("#area_refresh,#sub_area_refresh,#first_tab").on('click', function() {
        areRefresh();
    });

    // 削除
    $('#service_delete').on('click', function() {
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

    $(document).on('click', '#add_service', function() {
        $('#add_service_message').html('');
        $('#new_service_create').html('保存');
        $('#service_delete').removeClass('d-block');
        $('#service_delete').addClass('d-none');
        $("#service_update_id").val('');
        $("#service_name").val('');
        $("#add_service_modal").modal("show");
    });

    // 新規サービス追加
    $(document).on('click', '#new_service_create', function () {
        const edi_retail_company_id = $("#company_id_view_hidden").val();
        const service_id = $("#service_update_id").val();
        const service_name = $("#service_name").val().trim();
        const user_id = $('#user_id').val();
        const ActiveCompanyrowIndex = $(`#customer_info_table tbody tr[edi_retail_company_id='${edi_retail_company_id}']`).index();

        // 🔸 Validate service name
        if (service_name === '') {
            $('#add_service_message')
                .removeClass('alert-success')
                .addClass('alert-danger')
                .html('サービス名を入力してください。');
            return;
        }
        if (service_name.length > 50) {
            $('#add_service_message')
                .removeClass('alert-success')
                .addClass('alert-danger')
                .html('50文字以内で入力してください。');
            return;
        }

        // 🔸 Create FormData (CodeIgniter expects this)
        const formData = new FormData();
        formData.append('service_id', service_id);
        formData.append('company_id', edi_retail_company_id);
        formData.append('service_name', service_name);

        const add_service_url = properties.get('add_service_url');

        axios.post(api_url+add_service_url, formData)
            .then(({ data }) => {

                $('#add_service_message').removeClass('alert-danger').addClass(data.class_name);
                $('#add_service_message').html(data.message);

                // 🔸 Insert new row
                if (data.status == "success") {
                    if (service_id) {
                        customerInfoClickAuto(ActiveCompanyrowIndex)
                    }else{
                        $('.service_info_row.bg-secondary').removeClass("bg-secondary text-white");
                        let rows_numbers = $("#service_info_table tbody tr").length;
                        const rows_0_val = $("#service_info_table tbody tr:eq(0)").attr('remove_val');
                        if (rows_0_val == 1) {
                            $("#service_info_table tbody tr:eq(0)").remove();
                        } else {
                            rows_numbers += 1;
                        }
    
                        let raw_html = '';
                        raw_html += `<tr class="service_info_row bg-secondary text-white" 
                                        remove_val="0" 
                                        service-id="${data.id}" 
                                        service-name="${service_name}">
                                        <td>${rows_numbers}</td>
                                        <td id="service_edit_form">${service_name}</td>
                                        <td style="text-align:center;" id="service_execution"><i class="far fa-play-circle" style="font-size:30px;"></i></td>
                                        <td style="text-align:center;" id="service_configureation"><i class="fas fa-cog" style="font-size:30px;"></i></td>
                                    </tr>`;
                        $('#service_info_table tbody').append(raw_html);
                    }
                    alertMessageClassRemove(data.class_name, data.message, 'alert-danger');
                    companyInfo(user_id, 1);
                    $("#add_service_modal").modal("hide");

                }
            })
            .catch((error) => {
                console.error('Service API error:', error);
                alert("接続用API設定を確認してください");
            });
    });

    $(document).on('click', '.service_info_row', function() {
        var service_id = $(this).attr('service-id');
        // rpa_schedule_show(service_id);
        $('.service_info_row.bg-secondary').removeClass("bg-secondary text-white");
        $(this).addClass('bg-secondary text-white');
        $('#alert_message').html('');

    });

    $(document).on('click', '#service_edit_form', function() {
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
    $(document).on('click', '#service_delete', function() {
        var service_id = $("#service_update_id").val();
        var clicked_row = $("#clicked_row_number").val();

        var delete_service_url = properties.get('delete_service_url');
        // const formData = new FormData();
        // formData.append('service_id', service_id);
        // var body_data = { service_id: service_id }
        axios.get(api_url+delete_service_url+"/"+service_id).then(({ data }) => {
            if (data.status == "success") {
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
        }).catch(function(err) {
            alert("接続用API設定を確認してください");
        });
    });


    $(document).on('click', '#service_configureation', function() {
        var service_id = $(this).closest('tr').attr('service-id');
        $('#service_id_for_job_exec_trigger').val(service_id);
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
    // Ending point 
});