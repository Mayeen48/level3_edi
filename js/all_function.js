let global_companies = [];
let base_api_url=properties.get('base_api_url');
let prefix=properties.get('prefix');
let api_url=base_api_url+prefix

async function trigger(service_id = null, service_traking_number = 0) {

    var setting_modul_check = $('#schedule_modal').is(':visible');
    var service_id_array = [];
    var traking_number_array = [];

    if (service_id == null || service_id == 0) {
        global_companies.forEach(company => {
             let services = company.services;
            services.forEach(element => {
                service_id_array.push(element.id)
            });
        });
    } else {
        log.info('Manual')
        service_id_array.push(service_id)
        traking_number_array.push(service_traking_number)
    }
    service_id_array.sort();
    if (service_id_array.length == 0) {
        log.debug("No service ID found");
        return 0;
    }
    if (setting_modul_check) {
        var service_id_for_job_exec_trigger = $('#service_id_for_job_exec_trigger').val();
        service_id_array = $(service_id_array).not([service_id_for_job_exec_trigger]).get();
    }
    let i = 0;
    while (i < service_id_array.length) {
        service_id = service_id_array[i];

        // log.debug("service_id:" + service_id);

        service_traking_number = traking_number_array[i];
        await single_service_exec(service_id, service_traking_number)
        i++;
    }
}

function single_service_exec(service_id, service_traking_number) {
    let service = getServiceData(service_id);
    if (!service) {
        return false;
    }
    
    var service_name = service.service_name;
    var service_job=service.job
    if (!service_job) {
        return false;
    }
    if(service_job.job_type=='api'){
        if (service_job.api_execution_flag==1) {
            APIJob(service_id,service_name,service_job)
        }else{
            log.debug('API Execution flag off for service'+service_name)
        }
        if (service_job.path_execution_flag==1) {
            pathExec(service_id,service_name,service_job)
        }else{
            log.debug('PATH Execution flag off for service'+service_name)
        }
    }
}

// service data 取得
function getServiceData(service_id) {
    for (let cust of global_companies) {
        let services = cust.services;
        for (let service of services) {
            if (service.id == service_id) {
                return service;
            }
        }
    }
    log.error("Can not get service data! service_id" + service_id);

    return null;
}


function pathExec(service_id, service_name, service_job) {
    const log_h = `[${service_name}][${service_id}]:`;

    // 🔸 1. Check folder path existence
    if (!service_job.source_dir_path || !service_job.moved_dir_path) {
        log.error(log_h + "Folder Path is empty");
        return false;
    }
    if (!fs.existsSync(service_job.source_dir_path)) {
        log.error(log_h + "Folder Path is not exist: " + service_job.source_dir_path);
        return false;
    }
    if (!fs.existsSync(service_job.moved_dir_path)) {
        log.error(log_h + "Folder Path is not exist: " + service_job.moved_dir_path);
        return false;
    }

    try {
        executionStartLogo(service_id)
        // 🔸 2. Read folder files
        const files_of_folder = fs.readdirSync(service_job.source_dir_path);
        if (!files_of_folder.length) {
            executionEndLogo(service_id);
            log.info(log_h + "Checked folder is empty: " + service_job.source_dir_path);
            return;
        }

        for (const file of files_of_folder) {
            const fp = path.join(service_job.source_dir_path, file);

            // 🔸 Check only files (skip directories)
            if (!files_test(fp)) continue;

            log.info(log_h + "folder check file: " + fp);

            // 🔸 Skip `.lock` files
            if (file.split(".").includes('lock')) {
                log.debug(log_h + "this is lock file: " + file);
                continue;
            }

            // 🔸 Create lock file
            const lock_file = fp + '.lock';
            if (fs.existsSync(lock_file)) {
                log.debug(log_h + "already locked: " + file);
                continue;
            }

            fs.writeFileSync(lock_file, '');
            log.debug(log_h + 'created lock file: ' + lock_file);

            // 🔸 Move file
            const moved = moveFile(service_job.source_dir_path, service_job.moved_dir_path, file);
            if (moved) {
                log.info(log_h + 'Moved file successfully: ' + file);
            } else {
                log.error(log_h + 'Failed to move file: ' + file);
            }

            // 🔸 Remove lock file
            try {
                fs.unlinkSync(lock_file);
                log.debug(log_h + "Removed lock file: " + lock_file);
            } catch (error) {
                log.error(log_h + "Cannot remove .lock file: " + lock_file);
            }
        }
        executionEndLogo(service_id);

    } catch (e) {
        executionErrorLogo(service_id);
        log.error(log_h + "Folder check exception: " + e);
        mailsend("[Level3]エラー", log_h + "Folder check exception: " + e);
    }
}


function APIJob(service_id,service_name,service_job) {
    let log_h = "[" + service_name + "][" + service_id + "]:";

    if (!fs.existsSync(service_job.api_dir_path)) {
        log.error(log_h + 'API Folder Path Directory not found.');
        return ;
    }
    if (!service_job.api_url) {
        log.info(log_h + 'API Trigger not set')
        return ;
    }
    executionStartLogo(service_id)
    var formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    axios.post(service_job.api_url, formData).then(({
        data
    }) => {
        if (!data.success){
            executionEndLogo(service_id);
            return;
        }
        var files=data.files
        files.forEach(file => {
            file_save_from_url(file.file_name, file.file_url, service_job.api_dir_path, function (download_status) {
                    log.info(log_h + "File save from API:" + file.file_url)
                })
        });
        executionEndLogo(service_id);
    }).catch((e) => {
        executionErrorLogo(service_id);
        log.error(log_h + 'APIJob [service.api_url]:' + service.api_url + ' exception:' + e);
        mailsend("[Level3]エラー", 'APIJob [service.api_url]:' + service.api_url + ' exception:' + e);
    });
}

function executionStartLogo(service_id) {
    const idStr = String(service_id);
    const $row = $('#service_info_table tbody tr').filter(function () {
        return $(this).attr('service-id') === idStr;
    });
    const rowIndex = $row.index();

    if (rowIndex !== -1) {
        $('#service_info_table tbody tr').eq(rowIndex).find('td').eq(2).html('<p>Running...</p>');
    }
}

function executionErrorLogo(service_id) {
    const idStr = String(service_id);
    const $row = $('#service_info_table tbody tr').filter(function () {
        return $(this).attr('service-id') === idStr;
    });

    if ($row.length) {
        $row.find('td').eq(2).html('<p style="color:red;">Error...</p>');
    }
}

function executionEndLogo(service_id) {
    const idStr = String(service_id);
    const $row = $('#service_info_table tbody tr').filter(function () {
        return $(this).attr('service-id') === idStr;
    });

    if ($row.length) {
        $row.find('td').eq(2).html('<i class="far fa-play-circle" style="font-size:30px;"></i>');
    }
}

function executionNormal() {
    $("#service_info_table > tbody > tr").each(function () {
        $(this).find('td').eq(2).html('<i class="far fa-play-circle" style="font-size:30px;"></i>');
    });
}
// current time return 
function cur_time() {
    var dt = new Date();
    var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    return time;
}

// Time process 
function time_process(time) {
    var date_time_stamp = new Date("November 13, 2013 " + time);
    var time_stamp_time = date_time_stamp.getTime();
    return time_stamp_time;
}

// API Data 
function rpa_schedule_show(service_id) {
    var user_id = $('#user_id').val();
    var formData=new FormData()
    formData.append('service_id', service_id);
    var get_schedule_data_url = properties.get('get_schedule_data_url');
    var getRpaData = axios.post(api_url+get_schedule_data_url, formData);
    getRpaData.then(({
        data
    }) => {
        // console.log(data)
        // data
        if (data.success==true && (data.data).length != 0) {
            var file_path_info=data.data
            if (file_path_info['path_execution_flag'] == 1) {
                $("#path_execution_flag").prop("checked", true);
            } else {
                $("#path_execution_flag").prop("checked", false);
            }
            if (file_path_info['api_execution_flag'] == 1) {
                $("#api_execution_flag").prop("checked", true);
            } else {
                $("#api_execution_flag").prop("checked", false);
            }

            $('#file_job_id').val(file_path_info['id']);
            $('#source_dir_path_input').val(file_path_info['source_dir_path']);
            $('#moved_dir_path_input').val(file_path_info['moved_dir_path']);
            $('#api_url').val(file_path_info['api_url']);
            $('#api_dir_path_input').val(file_path_info['api_dir_path']);

        } else {
            $("#file_job_id").val('');
            $("#path_execution_flag").prop("checked", false);
            $("#api_execution_flag").prop("checked", false);
            $('#source_dir_path_input').val('');
            $('#moved_dir_path_input').val('');
            $('#api_url').val('');
            $('#api_dir_path_input').val('');
        }
        $('.loader').removeClass('d-block');
        $('.loader').addClass('d-none');
    }).catch((e) => {
        log.error('rpa_schedule_show [get_schedule_data_url]:' + get_schedule_data_url + ' exception:' + e);
        mailsend("[Level3]エラー", 'rpa_schedule_show [get_schedule_data_url]:' + get_schedule_data_url + ' exception:' + e);
    });
}


function user_login() {
    var user_name = properties.get('user_name');
    var password = properties.get('password');
    var login_url = properties.get('login_url');
    // var company_id = properties.get('company_id');

    if (!user_name || !password) {
        alert("Email&Passwordがありません。properties.fileを確認してください。\n");
        log.error("Email&Passwordがありません。properties.fileを確認してください。");
        window.close();
        return;
    }

    $('#user_name_show').html(user_name);

    const formData = new FormData();
    formData.append('sign_in_username_email', user_name);
    formData.append('sign_in_password', password);

    axios.post(api_url+login_url, formData)
        .then(({ data }) => {
            if (data.status !== "success") {
                let errors = data.errors || {};
                let messages = [];
                if (errors.sign_in_username_email) messages.push(errors.sign_in_username_email);
                if (errors.sign_in_password) messages.push(errors.sign_in_password);

                const alertMsg = messages.length > 0 ? messages.join('\n') : (data.message || "Unknown error occurred");
                alert(alertMsg);
                log.error(alertMsg);
                window.close();
            } else {
                log.info('Logged by: ' + data.user.user_name);
                $('#user_name_show').html(data.user.user_name);
                $('#user_id').val(data.user.id);
                companyInfo(data.user.id);
                $('.loader').removeClass('d-block').addClass('d-none');
                $('.container').removeClass('d-none').addClass('d-block');
            }
        })
        .catch((error) => {
            console.error(error);
            alert("サーバーに接続できません。");
            log.error("サーバーに接続できません。");
            window.close();
        });
}


function alertCsvCount(myFile) {
    var contents = fs.readFileSync(myFile)
    var lines = contents.toString().split('\n').length - 1;
    return lines;
}

function alertCsvData(myFile) {
    var contents = fs.readFileSync(myFile)
    return contents;
}

function moveFile(file_source_oath, file_move_path, moved_file_name) {
    //moves the $file to $dir2
    //gets file name and adds it to dir2
    var new_file_name = fileNameChange(moved_file_name);
    var f = path.basename(file_source_oath + "/" + new_file_name);
    var dest = path.resolve(file_move_path + "/", f);
    let fp = file_source_oath + "/" + moved_file_name;

    try {
        fs.renameSync(fp, dest);
    } catch (e) {
        log.error("can not move file: [source]:" + fp + " [dest]:" + file_move_path + "/" + new_file_name + "exception:" + e);
        return false;
    }
    log.info('ファイル移動が完了しました。:' + fp);
    return true;
}

function fileNameChange(fileName) {
    var ext = checkFileExt(fileName);
    var file_name = checkFileName(fileName);
    return file_name + "_" + time_process(cur_time()) + "." + ext;
}

function checkFileExt(filename) {
    filename = filename.toLowerCase();
    var file_array = filename.split('.');
    return file_array[file_array.length - 1];
}

function checkFileName(filename) {
    filename = filename.toLowerCase();
    var file_array = filename.split('.');
    return file_array[0];
}

function files_test(dir) {
    var stats = fs.statSync(dir);
    return stats.isFile();
}

function folder_create(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }

}

async function file_save_from_url(file_name, file_url, file_move_path, callback) {
    try {
        const response = await fetch(file_url);
        if (!response.ok) throw new Error("Network error");

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFile(path.join(file_move_path, file_name), buffer, (err) => {
            if (err) {
                console.error(err);
                log.info("File not saved to " + file_move_path);
                callback(0);
            } else {
                log.info("File Saved: " + file_name);
                callback(1);
            }
        });
    } catch (e) {
        console.error("Download failed:", e);
        log.info("File can not be downloaded!");
        callback(0);
    }
}


function companyInfo(user_id = null, reload_flag = 0) {
    // console.log(user_id)
    var get_company_url = properties.get('get_company_url');
    const formData = new FormData();
    formData.append('account_id', user_id);

    axios.post(api_url + get_company_url, formData)
    .then(({ data }) => {
        if (reload_flag == 1) {
            global_companies = data;
        } else {
            global_companies = data;
            var raw_html = '';
            for (let i = 0; i < data.length; i++) {
                // console.log(data.length)
                raw_html += '<tr class="cust_info_row" edi_retail_company_id="' + data[i].edi_retail_company_id + '" adm_user_id="' + user_id + '" company-name="' + data[i].name + '">';
                raw_html += '<td>' + (i + 1) + '</td>';
                raw_html += '<td>' + data[i].name + '</td>';
                raw_html += '</tr>';
            }
            $('#customer_info_table tbody').html(raw_html);
            customerInfoClickAuto()

        }
    }).catch((e) => {
        log.error('customerInfo [get_customer_url]:' + get_customer_url + ' exception:' + e);
        mailsend("[Level3]エラー", 'customerInfo [get_customer_url]:' + get_customer_url + ' exception:' + e);
        // alert("接続用API設定を確認してください");
    })
}

function customerInfoClickAuto(rowNum=0) {
    setTimeout(() => {
        const firstRow = $('.cust_info_row').eq(rowNum);
        if (firstRow.length) {
            firstRow.trigger('click');
        } else {
            console.warn('No .cust_info_row found.');
        }
    }, 300); // adjust delay as needed
}
function serviceShow(company_id) {
    if (!company_id) {
        console.error("Company ID is required");
        return;
    }

    const service_data_url = properties.get('get_service_data_url');

    axios.get(api_url+service_data_url+"/"+company_id)
        .then(({ data }) => {
            if (data.status !== 'success') {
                console.error('Failed to fetch services:', data);
                $('#service_info_table tbody').html('<tr remove_val="1"><td colspan="4">サービスの取得に失敗しました</td></tr>');
                return;
            }

            const service_data = data.services || [];
            let raw_html = '';

            if (service_data.length > 0) {
                for (let i = 0; i < service_data.length; i++) {
                    const service = service_data[i];
                    raw_html += `
                        <tr class="service_info_row" remove_val="0" 
                            company-id="${data.company_id}" 
                            service-id="${service.id}" 
                            service-name="${service.service_name}">
                            <td>${i + 1}</td>
                            <td id="service_edit_form">${service.service_name}</td>
                            <td style="text-align:center;" id="service_execution">
                                <i class="far fa-play-circle" style="font-size:30px;"></i>
                            </td>
                            <td style="text-align:center;" id="service_configureation">
                                <i class="fas fa-cog" style="font-size:30px;"></i>
                            </td>
                        </tr>
                    `;
                }
            } else {
                raw_html = '<tr remove_val="1"><td colspan="4">登録済みのサービスがありません</td></tr>';
            }

            $('#service_info_table tbody').html(raw_html);
        })
        .catch(error => {
            console.error('Error fetching services:', error);
            $('#service_info_table tbody').html('<tr remove_val="1"><td colspan="4">サーバー接続エラーが発生しました</td></tr>');
        });
}

function areRefresh(rownum = 0) {
    $("#tabs2").tabs({
        active: 0
    });
    $('.cust_info_row').removeClass("bg-secondary text-white");
    var cmn_connect_id = $("#customer_info_table>tbody>tr:eq(" + rownum + ")").attr('cmn_connect_id');
    var adm_user_id = $("#customer_info_table>tbody>tr:eq(" + rownum + ")").attr('adm_user_id');
    var company_name = $("#customer_info_table>tbody>tr:eq(" + rownum + ")").attr('company-name');
    var partner_code = $("#customer_info_table>tbody>tr:eq(" + rownum + ")").attr('partner-code');
    $('#company_name_view').html(company_name);
    $('#company_id_view').html(partner_code);
    $('#company_id_view_hidden').html(partner_code);
    $('#cmn_connect_id_for_schedule').val(cmn_connect_id);
    alertMessageClassRemove('', '', 'alert-danger');
    $('.cust_info_row:eq(' + rownum + ')').addClass('bg-secondary text-white');
    serviceNameShow(cmn_connect_id)
}



function scheduleMessageClassRemove(addClass, message, removeClass) {
    $('#rpa_schedule_message').removeClass(removeClass);
    $('#rpa_schedule_message').html(message);
    $('#rpa_schedule_message').addClass(addClass);
}

function alertMessageClassRemove(addClass, message, removeClass) {
    $('#alert_message').removeClass(removeClass);
    $('#alert_message').html(message);
    $('#alert_message').addClass(addClass);
}