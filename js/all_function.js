function trigger(service_id = null, service_traking_number = 0) {
    var service_id_array = [];
    var traking_number_array = [];
    if (service_id == null || service_id == 0) {
        $("#service_info_table > tbody > tr").each(function() {
            var service_id_in_row = $(this).attr('service-id');
            service_id_array.push(service_id_in_row)
            traking_number_array.push($(this).index())
        });
    } else {
        service_id_array.push(service_id)
        traking_number_array.push(service_traking_number)
    }
    if (service_id_array.length == 0) {
        console.log("No service ID found");
        return 0;
    }
    for (let i = 0; i < service_id_array.length; i++) {
        service_id = service_id_array[i];
        service_traking_number = traking_number_array[i];

        time_date_match(service_id, 1, function(time_data) {
            if (time_data == 0) {
                time_date_match(service_id, 2, function(date_data) {
                    if (date_data == 0) {
                        folderCheck(service_id, function(folder_data) {
                            if (folder_data == 0) {
                                APICheck(service_id, function(job_execute_flg, data) {
                                    if (job_execute_flg == 0) {
                                        console.log('File Not Downloaded from trigger')
                                    } else {
                                        console.log('File Downloaded from trigger')
                                        jobExec(service_id, service_traking_number, data)
                                    }
                                })
                            } else {
                                jobExec(service_id, service_traking_number)
                            }
                        })
                    } else {
                        jobExec(service_id, service_traking_number)
                    }
                })
            } else {
                jobExec(service_id, service_traking_number)
            }
        });

    }
}


function time_date_match(service_id, type = 1, callback) {
    if (service_id) {
        var schedule_body_data = {
            service_id: service_id,
            trigger_execution_time: trigger_execution_time,
            type: type
        }
        var lv3_schedule_data_url = properties.get('lv3_schedule_data_url');
        axios.post(lv3_schedule_data_url, schedule_body_data).then(({
            data
        }) => {
            var schedule_date_time_data = data.schedule_date_time_data;
            if (schedule_date_time_data.length) {
                if (jQuery.inArray(true, schedule_date_time_data) != -1) {
                    callback(1);
                } else {
                    callback(0);
                }
            } else {
                console.log("Please add schedule");
                callback(0);
            }
        }).catch((e) => {
            alert("接続用API設定を確認してください");
        });
    } else {
        console.log("No service id found");
    }
}

function folderCheck(service_id, callback) {
    var service_row = $('#service_info_table tbody tr[service-id="' + service_id + '"]').index();
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = {
        service_id: service_id
    }
    axios.post(get_service_data_url, body_data).then(({
        data
    }) => {
        var service = data.service;
        // console.log(service)
        if (!jQuery.isEmptyObject(service)) {
            let checked_files = [];
            if (service.path_execution_flag) {
                try {
                    let files_of_folder = fs.readdirSync(service.check_folder_path + "/");
                    for (let i = 0; i < files_of_folder.length; i++) {
                        if (files_test(service.check_folder_path + '/' + files_of_folder[i])) {
                            checked_files.push(files_of_folder[i])
                        }
                    }
                } catch (error) {
                    console.log("Folder is empty");
                    // executionErrorLogo(4)
                }
                // console.log(checked_files)
                if (checked_files.length > 0) {
                    if (service.job_execution_flag) {
                        callback(1);
                    } else {
                        callback(0);
                        console.log("Job execution off");
                    }
                } else {
                    callback(0);
                    console.log("Checked folder is empty");
                }
            } else {
                console.log("Path execution off");
                callback(0);
            }

        } else {
            console.log('Service ' + (service_row + 1) + ' Folder setup not completed yet');
        }
    }).catch(() => {
        console.log('Service ' + (service_row + 1) + ' Folder setup not completed yet');
    });
}

function APICheck(service_id, callback) {
    var service_row = $('#service_info_table tbody tr[service-id="' + service_id + '"]').index();
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = {
        service_id: service_id
    }
    axios.post(get_service_data_url, body_data).then(({
        data
    }) => {
        var service = data.service;
        // console.log(service);
        if (service.api_url) {
            axios.post(service.api_url, { email: email, password: password }).then(({ data }) => {
                var file_name = data.file_name
                var file_path = data.file_path
                if (data.status_code == 200) {
                    var job_execute_flg = true;
                    if (file_name || file_path) {
                        file_save_from_url(file_name, file_path, service.api_folder_path, function(download_status) {
                            job_execute_flg = download_status;
                            callback(job_execute_flg, data)
                        })
                    } else {
                        callback(job_execute_flg, data)
                    }
                    // files_array.forEach(element => {
                    //     file_save_from_url(element.file_name, element.file_path, service.api_folder_path, function(download_status) {
                    //         job_execute_flg = download_status;
                    //         callback(job_execute_flg, element, data)
                    //     })
                    // });
                } else {
                    console.log("API has no file")
                }
            }).catch(() => {
                alert('May be API is problem');
            });
        } else {
            console.log('API Trigger not set')
        }
    })
}

function jobExec(service_id, service_traking_number = null, response_data = []) {
    executionStartLogo(service_id)
        // console.log('My' + file_name);
    var order_history_data;
    var user_id = $('#user_id').val();
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = {
        service_id: service_id
    }
    axios.post(get_service_data_url, body_data).then(({
        data
    }) => {
        var service = data.service;
        if (service) {
            if (service.execution == 'batch') {
                if (service.batch_file_path != null) {
                    // =====my new code =====
                    const exec = require('child_process').exec;
                    var batch_file_path_with_arg = '';
                    if (response_data.hasOwnProperty("file_name")) {
                        let file_path = service.api_folder_path + '/' + response_data.file_name
                        batch_file_path_with_arg = (service.batch_file_path).replace('LV3_FILE_PATH', file_path)
                    }
                    if (response_data.hasOwnProperty("super_code")) {
                        batch_file_path_with_arg.replace('DATA-super_code', response_data.super_code)
                    }
                    if (response_data.hasOwnProperty("partner_code")) {
                        batch_file_path_with_arg.replace('DATA-partner_code', response_data.partner_code)
                    }
                    if (response_data.hasOwnProperty("work")) {
                        batch_file_path_with_arg.replace('DATA-work', response_data.work)
                    }
                    console.log(batch_file_path_with_arg)
                        // return 0;
                    const myShellScript = exec(batch_file_path_with_arg);
                    myShellScript.stdout.on('data', (data) => {
                        console.log(data);
                        // console.log("Job executed");
                        // do whatever you want here with data
                        order_history_data = {
                            process_type: service_traking_number == null ? 'Auto' : 'Manual',
                            user_id: user_id,
                            service_id: (service.lv3_service_id),
                            status: 'Success',
                            execute_name: '発注データ',
                            history_message: "Job Executed Successfully"
                        }
                        historyCreate(order_history_data);
                        executionEndLogo(service_id);
                        if (service.next_service_id) {
                            var next_service_row = $('#service_info_table tbody tr[service-id="' + service.next_service_id + '"]').index();
                            trigger((service.next_service_id), next_service_row);
                        }
                    });
                    myShellScript.stderr.on('data', (data) => {
                        console.error(data);
                        order_history_data = {
                            process_type: service_traking_number == null ? 'Auto' : 'Manual',
                            user_id: user_id,
                            service_id: (service.lv3_service_id),
                            status: 'Error',
                            execute_name: '発注データ',
                            history_message: "May be batch file or path is not valid"
                        }
                        historyCreate(order_history_data);
                        executionEndLogo(service_id);
                        return 0;
                    });
                    // =====my new code =====
                } else {
                    console.log('Service ' + (service_traking_number + 1) + ' Job setup not completed yet');
                    executionErrorLogo(service_id);
                }
            } else if (service.execution == 'scenario') {
                // console.log("HI");
                var checked_files = [];

                var job_scenario_api = properties.get('job_scenario_api');
                var scenario_array = JSON.parse(properties.get('scenario_array'))[service.cmn_scenario_id];
                if (scenario_array) {
                    var scenario_array_length = Object.keys(scenario_array).length;
                    var formData = new FormData();
                    formData.append('scenario_id', service.cmn_scenario_id);
                    formData.append('email', email);
                    formData.append('password', password);
                    for (let i = 0; i < scenario_array_length; i++) {
                        const array_key = Object.keys(scenario_array)[i];
                        const array_value = Object.values(scenario_array)[i];
                        if (array_value == "LV3_FILE_DATA") {
                            try {
                                let files_of_folder = fs.readdirSync(service.check_folder_path + "/");
                                for (let i = 0; i < files_of_folder.length; i++) {
                                    if (files_test(service.check_folder_path + '/' + files_of_folder[i])) {
                                        checked_files.push(files_of_folder[i])
                                    }
                                }
                            } catch (error) {
                                console.log("Folder is empty");
                                // executionErrorLogo(4)
                            }
                            // console.log(checked_files)
                            if (checked_files.length > 0) {
                                let file_url_full = service.check_folder_path + '/' + checked_files[0]
                                formData.append(array_key, new Blob([fs.readFileSync(file_url_full)]), checked_files[0]);
                            }

                        } else {
                            formData.append(array_key, array_value);
                        }
                    }
                    // setTimeout(function(){
                    axios.post(job_scenario_api, formData).then(({ data }) => {
                        // console.log(data)
                        if (data.status == 0) {
                            if (checked_files.length > 0) {
                                if (service.moved_folder_path) {

                                    moveFile(service.check_folder_path, service.moved_folder_path, checked_files[0])
                                    order_history_data = {
                                        process_type: service_traking_number == null ? 'Auto' : 'Manual',
                                        user_id: user_id,
                                        service_id: (service.lv3_service_id),
                                        status: 'Success',
                                        execute_name: 'Shipment',
                                        history_message: "File Moved"
                                    }
                                    historyCreate(order_history_data);
                                } else {
                                    console.log("Can not move file");
                                    order_history_data = {
                                        process_type: service_traking_number == null ? 'Auto' : 'Manual',
                                        user_id: user_id,
                                        service_id: (service.lv3_service_id),
                                        status: 'Failed',
                                        execute_name: 'Shipment',
                                        history_message: "File saved but not moved"
                                    }
                                    historyCreate(order_history_data);
                                }
                            } else {
                                console.log("No file found");
                            }
                        } else {
                            console.log("Not OK");
                        }
                        executionEndLogo(service_id);
                    });
                    // }, 3000);

                } else {
                    console.log('Scenario ' + service.cmn_scenario_id + ' Not found in properties file');
                }
            }

        } else {
            console.log('Service ' + (service_traking_number + 1) + ' Job setup not completed yet');
            executionErrorLogo(service_id);
        }
    })
}

function executionStartLogo(service_id) {
    var service_row = $('#service_info_table tbody tr[service-id="' + service_id + '"]').index();
    $('#service_info_table tbody tr:eq(' + service_row + ') td:eq(2)').html('<p style="">Running...</p>');
}

function executionErrorLogo(service_id) {
    var service_row = $('#service_info_table tbody tr[service-id="' + service_id + '"]').index();
    $('#service_info_table tbody tr:eq(' + service_row + ') td:eq(2)').html('<p style="color:red;">Error...</p>');
}

function executionEndLogo(service_id) {
    var service_row = $('#service_info_table tbody tr[service-id="' + service_id + '"]').index();
    $('#service_info_table tbody tr:eq(' + service_row + ') td:eq(2)').html('<i class="far fa-play-circle" style="font-size:30px;"></i>');
}

function executionNormal() {
    $("#service_info_table > tbody > tr").each(function() {
        $(this).find('td:eq(2)').html('<i class="far fa-play-circle" style="font-size:30px;"></i>');
    });
}
// Text file download function 
function file_download(text, filename) {

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
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
    var user_data = {
        user_id: user_id,
        service_id: service_id
    };
    var get_schedule_data_url = properties.get('get_schedule_data_url');
    var getRpaData = axios.post(get_schedule_data_url, user_data);
    getRpaData.then(({
        data
    }) => {
        var file_path_info = data.file_path_info;
        var schedule_array = data.schedule_array;
        var job_info = data.job_info;
        var job_api_scenario_list = data.job_api_scenario_list;
        var all_service_data = data.all_service_data;
        if (schedule_array.length != 0) {
            var html_day = '';
            var html_day_sp = '';
            var j = 1;
            var k = 1;
            for (var i = 0; i < schedule_array.length; i++) {
                if (schedule_array[i].day == null) {
                    html_day += '<tr>';
                    html_day += '<td><input class="form-control" type="checkbox" name="record"></td>';
                    html_day += '<td>' + j + '</td>';
                    html_day += '<td><input type="time" id="time" schedule-id="' + schedule_array[i].schedule_id + '" status="' + schedule_array[i].disabled + '" value="' + schedule_array[i].time + '" required></td>';
                    html_day += '<td><input class="form-control" type="checkbox" id="sun"' + (schedule_array[i].weekday[0] == 1 ? 'checked' : '') + '></td>';
                    html_day += '<td><input class="form-control" type="checkbox" id="mon"' + (schedule_array[i].weekday[1] == 1 ? 'checked' : '') + ' ></td>';
                    html_day += '<td><input class="form-control" type="checkbox" id="tue"' + (schedule_array[i].weekday[2] == 1 ? 'checked' : '') + ' ></td>';
                    html_day += '<td><input class="form-control" type="checkbox" id="wed"' + (schedule_array[i].weekday[3] == 1 ? 'checked' : '') + ' ></td>';
                    html_day += '<td><input class="form-control" type="checkbox" id="thu"' + (schedule_array[i].weekday[4] == 1 ? 'checked' : '') + ' ></td>';
                    html_day += '<td><input class="form-control" type="checkbox" id="fri"' + (schedule_array[i].weekday[5] == 1 ? 'checked' : '') + ' ></td>';
                    html_day += '<td><input class="form-control" type="checkbox" id="sat"' + (schedule_array[i].weekday[6] == 1 ? 'checked' : '') + ' ></td>';
                    html_day += '</tr>';
                    j++;
                } else {
                    html_day_sp += '<tr>';
                    html_day_sp += '<td><input class="form-control" type="checkbox" name="rrrr"></td>';
                    html_day_sp += '<td>' + k + '</td>';
                    html_day_sp += '<td><input type="time" id="time_sp" value="' + schedule_array[i].time + '" required></td>';
                    html_day_sp += '<td><input class="form-control" type="checkbox" id="last_day" ' + (schedule_array[i].last_day == 1 ? 'checked' : '') + '></td>';
                    html_day_sp += '<td><input type="number" id="day" maxlength="2" style="width:50px;" value="' + schedule_array[i].day + '" ></td>';
                    html_day_sp += '</tr>';
                    k++;
                }
            }
            if (html_day.length == 0) {
                $('#week_data tbody').html('<tr><td colspan="10"><input type="hidden" id="no_data" value="0">データ無し</td></tr>');
            } else {
                $('#week_data tbody').html(html_day);
            }
            if (html_day_sp.length == 0) {
                $('#date_specification_table tbody').html('<tr><td colspan="5"><input type="hidden" id="no_data_sp" value="0">データ無し</td></tr>');
            } else {
                $('#date_specification_table tbody').html(html_day_sp);
            }

        } else {
            $('#week_data tbody').html('<tr><td colspan="10"><input type="hidden" id="no_data" value="0">データ無し</td></tr>');
            $('#date_specification_table tbody').html('<tr><td colspan="5"><input type="hidden" id="no_data_sp" value="0">データ無し</td></tr>');
        }
        if (file_path_info != null) {
            if (file_path_info['path_execution_flag'] == 1) {
                $("#path_execution_flag").prop("checked", true);
            } else {
                $("#path_execution_flag").prop("checked", false);
            }
            $('#file_path_id').val(file_path_info['file_path_id']);
            $('#check_folder_path_box').val(file_path_info['check_folder_path']);
            $('#move_folder_path_box').val(file_path_info['moved_folder_path']);
            $('#api_url').val(file_path_info['api_url']);
            $('#api_folder_path_box').val(file_path_info['api_folder_path']);

        } else {
            $("#file_path_id").val('');
            $("#path_execution_flag").prop("checked", false);
            $('#check_folder_path_box').val('');
            $('#move_folder_path_box').val('');
            $('#api_url').val('');
            $('#api_folder_path_box').val('');
        }
        if (job_info != null) {
            if (job_info['job_execution_flag'] == 1) {
                $("#job_execution_flag").prop("checked", true);
            } else {
                $("#job_execution_flag").prop("checked", false);
            }
            if (job_info['execution'] == 'scenario') {
                $("#scenario_execute").prop("checked", true);
            } else if (job_info['execution'] == 'batch') {
                $("#batch_execute").prop("checked", true);
            }

            $('#job_update_id').val(job_info['lv3_job_id']);
            $('#batch_file_path_box').val(job_info['batch_file_path']);

        } else {
            $("#job_update_id").val('');
            $("#job_execution_flag").prop("checked", false);
            $("#scenario_execute").prop("checked", false);
            $("#batch_execute").prop("checked", false);
            $('#batch_file_path_box').val('');
        }
        if (job_api_scenario_list.length != 0) {
            var scenario_html = '<option value="">Please select scenario</option>';
            job_api_scenario_list.forEach(element => {
                scenario_html += '<option value="' + element.cmn_scenario_id + '"' + (job_info != null ? (element.cmn_scenario_id == job_info.cmn_scenario_id ? "selected" : "") : "") + '>' + element.cmn_scenario_id + ' ' + element.name + '</option>'
            });
            $("#cmn_scenario_id").html(scenario_html);
        } else {
            $("#cmn_scenario_id").html('<option value="">No Scenario found</option>');
        }
        if (all_service_data.length != 0) {
            var this_next_service = '';
            if (job_info != null) {
                this_next_service = job_info.next_service_id;
            }
            var next_service = '<option value="">No Service</option>';
            all_service_data.forEach(service => {
                next_service += '<option value="' + service.lv3_service_id + '" ' + (service.lv3_service_id == this_next_service ? 'selected ' : '') + '' + (service.lv3_service_id == service_id ? 'hidden' : '') + ' >' + service.service_name + '</option>';
            });
            $("#next_service").html(next_service);
        } else {
            $("#next_service").html('<option value="">No service found</option>');
        }
        $('.loader').removeClass('d-block');
        $('.loader').addClass('d-none');
    }).catch(() => {
        console.log("接続用API設定を確認してください");
    });
}

function user_login() {
    var user_name = properties.get('user_name');
    var password = properties.get('password');
    var login_url = properties.get('login_url');
    if (user_name == null || user_name == '' || password == null || password == '') {
        alert("Email&Passwordがありません。properties.fileを確認してください。\n");
        window.close();
        return 0;
    } else {
        var user_data = {
            user_name: user_name,
            password: password
        };
        axios.post(login_url, user_data).then(({
            data
        }) => {
            if (data.message != "success") {
                alert(data.message);
                window.close();
            } else {
                $('#user_name_show').html(data.user_name);
                $('#user_id').val(data.user_id);
                history();
                customerInfo(data.user_id);
                $('.loader').removeClass('d-block');
                $('.loader').addClass('d-none');
                $('.container').removeClass('d-none');
                $('.container').addClass('d-block');
            }
        }).catch(() => {
            alert("サーバーに接続できません。");
            window.close();
        });
        // API Data 
    }
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
    // console.log(f);
    // console.log(dest);
    fs.rename(file_source_oath + "/" + moved_file_name, dest, (err) => {
        if (err) throw err;
        else console.log('ファイル移動が完了しました。');
    });

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

function file_save_from_url(file_name, file_url, file_move_path, callback) {
    fetch(file_url)
        .then(resp => resp.blob())
        .then(blob => {
            var reader = new FileReader()
            reader.onload = function() {
                var buffer = new Buffer(reader.result)
                fs.writeFile(file_move_path + "/" + file_name, buffer, {}, (err, res) => {
                    if (err) {
                        console.error(err);
                        console.log("File not saved to " + file_move_path);
                        callback(0)
                        return
                    } else {
                        callback(1)
                        console.log("File Saved");
                    }

                })
            }
            reader.readAsArrayBuffer(blob)

        })
        .catch(() => console.log('File can not be downloaded!'));
}

function customerInfo(user_id = null) {
    var get_customer_url = properties.get('get_customer_url');
    var body_data = {
        user_id: user_id
    }
    var cusrUrlCall = axios.post(get_customer_url, body_data);
    cusrUrlCall.then(({
        data
    }) => {
        var customers_data = data.customers_data;
        var raw_html = '';
        for (let i = 0; i < customers_data.length; i++) {
            raw_html += '<tr class="cust_info_row" cmn_connect_id="' + customers_data[i].cmn_connect_id + '" adm_user_id="' + user_id + '" partner-code="' + customers_data[i].partner_code + '" company-name="' + customers_data[i].company_name + '">';
            raw_html += '<td>' + (i + 1) + '</td>';
            raw_html += '<td>' + customers_data[i].company_name + '</td>';
            raw_html += '</tr>';
        }
        $('#customer_info_table tbody').append(raw_html);
    }).catch(() => {
        alert("接続用API設定を確認してください");
    })
}

function requestUrl(api_url, body_data = null) {
    var fval = fetch(api_url, {
        method: 'POST',
        body: JSON.stringify(body_data),
        headers: {
            'Content-Type': 'application/json'
        },
    })
    return fval;
}

function historyCreate(history_data) {
    var history_create_url = properties.get('history_create_url');
    axios.post(history_create_url, history_data).then(({
        data
    }) => {
        history();
    }).catch(() => {
        alert("接続用API設定を確認してください");
    });
}

function history() {
    var user_id = $('#user_id').val();
    var body_data = {
        user_id: user_id
    }
    var history_url = properties.get('history_url');
    axios.post(history_url, body_data).then(({
        data
    }) => {
        var histories = data.histories;
        var history_html = '';
        history_html += '<table class="table table-bordered" id="history_table">';
        history_html += '<thead>';
        history_html += '<th>No</th>';
        history_html += '<th>取引先名</th>';
        history_html += '<th>サービス名</th>'; //Service Name
        history_html += '<th>実行種別</th>'; //Execute type
        history_html += '<th>ステータス</th>';
        history_html += '<th>日時</th>';
        history_html += '</thead>';
        history_html += '<tbody>';
        var i = 1;
        histories.forEach(history => {
            history_html += '<tr>';
            history_html += '<td>' + i + '</td>';
            history_html += '<td>' + history.company_name + '</td>';
            history_html += '<td>' + history.service_name + '</td>';
            history_html += '<td>' + history.execute_type + '</td>';
            history_html += '<td class="history_message" hist_message="' + history.message + '" style="text-align:center; font-size:30px;">' + (history.status == "Success" ? '<i class="fa fa-check-circle" aria-hidden="true"></i>' : '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>') + '</td>';
            history_html += '<td>' + history.updated_at + '</td>';
            history_html += '</tr>';
            i++;
        });
        history_html += '</tbody>';
        history_html += '</table>';
        $('#history_table_div').html(history_html);
        $('#history_table').DataTable({
            "language": {
                "url": "./js/DataTableJapaneseLanguage.json"
            }
        });
    }).catch(() => {
        alert("接続用API設定を確認してください");
    });

}

function formatDate(date) {
    var d = date.getFullYear() + '-' +
        length_fill(date.getMonth() + 1) + '-' +
        length_fill(date.getDate()) + ' ' +
        length_fill(date.getHours()) + ':' +
        length_fill(date.getMinutes()) + ':' +
        length_fill(date.getSeconds());
    return d.toString();
}

function length_fill(data_string) {
    var strlenth = data_string.toString().length;
    var str;
    if (strlenth < 2) {
        str = "0" + data_string;
    } else {
        str = data_string;
    }
    return str;
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
    $('#partner_code_view').html(partner_code);
    $('#cmn_connect_id_for_schedule').val(cmn_connect_id);
    alertMessageClassRemove('', '', 'alert-danger');
    $('.cust_info_row:eq(' + rownum + ')').addClass('bg-secondary text-white');
    serviceNameShow({
        cmn_connect_id: cmn_connect_id,
        adm_user_id: adm_user_id
    })
}

function serviceNameShow(get_service_parameters) {
    var show_service_url = properties.get('show_service_url');
    var serviceData = axios.post(show_service_url, get_service_parameters);
    serviceData.then(({
        data
    }) => {
        var service_data = data.all_service_data;
        var raw_html = '';
        if (service_data.length) {
            for (let i = 0; i < service_data.length; i++) {
                raw_html += '<tr class="service_info_row" remove_val="0" service-id="' + service_data[i].lv3_service_id + '" service-name="' + service_data[i].service_name + '">';
                raw_html += '<td>' + (i + 1) + '</td>';
                raw_html += '<td id="service_edit_form">' + service_data[i].service_name + '</td>';
                raw_html += '<td style="text-align:center;" id="service_execution"><i class="far fa-play-circle" style="font-size:30px;"></i></td>';
                raw_html += '<td style="text-align:center;" id="service_configureation"><i class="fas fa-cog" style="font-size:30px;"></i></td>';
                raw_html += '</tr>';

            }
        } else {
            raw_html = '<tr remove_val="1"><td colspan="4">No data found</td></tr>';
        }

        $('#service_info_table tbody').html(raw_html);
        if (service_data.length) {
            rpa_schedule_show(service_data[0].lv3_service_id);
        }
    }).catch(() => {
        alert("接続用API設定を確認してください");
    });
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

function downloadPDF(file_name, file_path_url) {
    var oReq = new XMLHttpRequest();
    // Configure XMLHttpRequest
    oReq.open("GET", file_path_url, true);
    // Important to use the blob response type
    oReq.responseType = "blob";
    // When the file request finishes
    // Is up to you, the configuration for error events etc.
    oReq.onload = function() {
        // Once the file is downloaded, open a new window with the PDF
        // Remember to allow the POP-UPS in your browser
        var file = new Blob([oReq.response], {
            type: 'application/pdf'
        });
        // Generate file download directly in the browser !
        saveAs(file, file_name);
    };

    oReq.send();
}