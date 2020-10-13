// const electron = require('electron').remote;
// var PropertiesReader = require('properties-reader');
// var window = electron.getCurrentWindow();
// var request = require('request');
// var fs = require('fs');
// var FileSaver = require('file-saver');
// Time match function 
// var reqest_ulr = '';

function time_match() {
    var time_array = new Array();
    // var day_array = new Array();
    var customer_name = $('#company_name_view').html();
    // var user_id = $('#user_id').val();
    // var customer_id = $('#customer_id_for_schedule').val();
    var service_id = $("#service_info_table > tbody > tr:eq(0)").attr('service-id');
    if (!service_id) {
        // alertMessageClassRemove('alert-danger', 'Please add 3 job for the customer: ' + customer_name, 'alert-success');
        console.log("No service ID found for order1");
        return 0;
    }
    var today = new Date().getDay();
    if (service_id) {
        var schedule_time_data_url = properties.get('schedule_time_data_url');
        var schedule_body_data = { service_id: service_id }
        axios.post(schedule_time_data_url, schedule_body_data).then(({ data }) => {
            var schedule_time_data = data.schedule_time_data;
                    if (schedule_time_data.length) {
                        schedule_time_data.forEach(element => {
                            time_array.push([element.time, element.lv3_trigger_schedule_id, element.weekday]);
                        });
                        var car_time = cur_time();
                        var dt = new Date();
                        var timeObject = new Date(dt.getTime() - trigger_execution_time);
                        var time = timeObject.getHours() + ":" + timeObject.getMinutes() + ":" + timeObject.getSeconds();
                        var current_time = time_process(car_time)
                        var advance_time = time_process(time)
                            // console.log(current_time);
                            // console.log(advance_time);
                        for (var i = 0; i < time_array.length; i++) {
                            var arr_time = time_process(time_array[i][0]);
                            if (jQuery.inArray(today, time_array[i][2]) != -1) {
                                // if condition is problem in exe file setup 
                                if (arr_time <= current_time && arr_time > advance_time) {
                                    // console.log("Time matched");
                                    service1Process(service_id);
                                    // pathExecuteAll();
                                } else {
                                    console.log('[Trigger: ' + (i + 1) + '] Time not in range.');
                                }
                                // pathExecuteAll();
                            } else {
                                // console.log("Date not in range");
                            }


                        }
                    } else {
                        console.log("Please add schedule");
                        // alertMessageClassRemove('alert-danger', 'Please add schedule', 'alert-success')
                    }
        }).catch(()=>{
            alert("接続用API設定を確認してください");
        });
    } else {
        console.log("No service id found");
    }
}

// Service1
function service1Process(service_id = null, process_type = "Auto") {
    // console.log("Job1 executing...");
    executionStartLogo(0)
    var user_id = $('#user_id').val();
    var service_id = $("#service_info_table > tbody > tr:eq(0)").attr('service-id')
    if (!service_id) {
        // alertMessageClassRemove('alert-danger', 'Please add 3 order job for the customer: ' + customer_name, 'alert-success');
        console.log("No service ID found for Order1");
        return 0;
    }
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = { service_id: service_id, service: 1 }
    axios.post(get_service_data_url, body_data).then(({ data }) => {
        var service1 = data.service1;
                // console.log(json);
                // console.log(service1);
                if (!jQuery.isEmptyObject(service1)) {
                    if (process_type == "Manual") {
                        service1Execution(service1, user_id, process_type)
                    } else {
                        if (service1.job_execution_flag) {
                            service1Execution(service1, user_id, process_type)
                        } else {
                            executionEndLogo(0);
                            console.log("Job execution off for order1");
                        }
                    }
                } else {
                    console.log("Order1 setup not completed yet");
                    executionErrorLogo(0)
                }
    }).catch(()=>{
        alert("接続用API設定を確認してください");
    });
}

function service1Execution(service1, user_id, process_type) {
    var order_history_data;
    if (service1.execution == 'batch') {
        fs.access(service1.batch_file_path, fs.F_OK, (err) => {
            if (err) {
                // console.log("May be batch file or path is not valid");
                order_history_data = {
                    process_type: process_type,
                    user_id: user_id,
                    service_id: (service1.lv3_service_id),
                    status: 'Error',
                    execute_name: '発注データ',
                    history_message: "May be batch file or path is not valid for order1"
                }
                historyCreate(order_history_data);
                executionEndLogo(0);
                return 0;
            } else {
                shell.openItem(service1.batch_file_path);
                order_history_data = {
                    process_type: process_type,
                    user_id: user_id,
                    service_id: (service1.lv3_service_id),
                    status: 'Success',
                    execute_name: '発注データ',
                    history_message: "Order1 Job Executed Successfully"
                }
                historyCreate(order_history_data);
                executionEndLogo(0);
            }
            //file exists
        })
    } else if (service1.execution == 'api') {
        // console.log("API not allow for this job");
        order_history_data = {
            process_type: process_type,
            user_id: user_id,
            service_id: (service1.lv3_service_id),
            status: 'Error',
            execute_name: '発注データ',
            history_message: "API not allow for this job in order1"
        }
        historyCreate(order_history_data);
        executionErrorLogo(0);
    }
}
// axios.post(get_service_data_url, body_data).then(({ data }) => {
    
// }).catch(()=>{
//     alert("接続用API設定を確認してください");
// });
// Service2
function service2Process(service_id = null, process_type = "Auto") {
    // console.log("Job2 executing...");
    executionStartLogo(1)
    var customer_name = $('#company_name_view').html();
    var user_id = $('#user_id').val();
    // var order_history_data = '';
    var service_id = $("#service_info_table > tbody > tr:eq(1)").attr('service-id')
    if (!service_id) {
        // alertMessageClassRemove('alert-danger', 'Please add 3 order job for the customer: ' + customer_name, 'alert-success');
        console.log("No service ID found for Order2");
        return 0;
    }
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = { service_id: service_id, service: 2 }
    axios.post(get_service_data_url, body_data).then(({ data }) => {
        var service2 = data.service2;
        if (!jQuery.isEmptyObject(service2)) {
            if (process_type == "Manual") {
                service2Execution(service2, user_id, process_type)
            } else {
                if (service2.path_execution_flag) {
                    service2Execution(service2, user_id, process_type)
                } else {
                    executionEndLogo(1)
                    console.log("Path execution off for order2");
                }
            }
        } else {
            console.log("Order2 setup not completed yet");
            executionErrorLogo(1)
        }
    }).catch(()=>{
        alert("接続用API設定を確認してください in order2");
    });
    // $("#service_info_table > tbody > tr").each(function() {
    //     service_id_all.push($(this).attr('service-id'));
    // });
    // if (service_id_all.length < 3) {
    //     console.log('Please add 3 job for the customer: ' + customer_name);
    //     // alertMessageClassRemove('alert-danger', 'Please add 3 job for the customer: ' + customer_name, 'alert-success');
    //     return 0;
    // }
}

function service2Execution(service2, user_id, process_type) {
    var order_history_data;
    var files = [];
    try {
        var files_of_folder = fs.readdirSync(service2.check_folder_path + "/");
        // if (files) {
        for (let j = 0; j < files_of_folder.length; j++) {
            if (files_test(service2.check_folder_path + '/' + files_of_folder[j])) {
                files.push(files_of_folder[j])
            }
        }

    } catch (error) {
        console.log("Folder is empty");
        executionErrorLogo(1)
    }
    if (files.length) {
        fs.access(service2.batch_file_path, fs.F_OK, (err) => {
            if (err) {
                // console.log("May be batch file or path is not valid");
                order_history_data = {
                    process_type: process_type,
                    user_id: user_id,
                    service_id: (service2.lv3_service_id),
                    status: 'Error',
                    execute_name: '発注データ',
                    history_message: "May be batch file or path is not valid for order2"
                }
                historyCreate(order_history_data);
                executionEndLogo(1);
                return 0;
            } else {
                shell.openItem(service2.batch_file_path);
                order_history_data = {
                    process_type: process_type,
                    user_id: user_id,
                    service_id: (service2.lv3_service_id),
                    status: 'Success',
                    execute_name: '発注データ',
                    history_message: "Order2 Job Executed Successfully"
                }
                historyCreate(order_history_data);
                executionEndLogo(1);
            }
        })
    } else {
        // console.log("Folder is empty");
        fs.access(service2.check_folder_path, fs.F_OK, (err) => {
            console.log(err);
            if (err) {
                order_history_data = {
                    process_type: process_type,
                    user_id: user_id,
                    service_id: (service2.lv3_service_id),
                    status: 'Error',
                    execute_name: '発注データ',
                    history_message: "May be check folder path is not valid or it is empty for order2"
                }
                historyCreate(order_history_data);
            }
        });
        executionEndLogo(1);
    }
}
// Service3
function service3Process(service_id = null, process_type = "Auto") {
    // console.log("Job3 executing...");
    executionStartLogo(2)
    var customer_name = $('#customer_name_view').html();
    var user_id = $('#user_id').val();
    var service_id = $("#service_info_table > tbody > tr:eq(2)").attr('service-id')
    if (!service_id) {
        // alertMessageClassRemove('alert-danger', 'Please add 3 order job for the customer: ' + customer_name, 'alert-success');
        console.log("No service ID found for Order3");
        executionErrorLogo(2)
        return 0;
    }
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = { service_id: service_id, service: 3 }

    requestUrl(get_service_data_url, body_data).then(res => res.json())
        .then(
            json => {
                var service3 = json.service3;
                if (!jQuery.isEmptyObject(service3)) {
                    if (process_type == "Manual") {
                        service3Execution(service3, user_id, process_type);
                    } else {
                        if (service3.path_execution_flag) {
                            service3Execution(service3, user_id, process_type);
                        } else {
                            console.log("Path execution off for order3");
                            executionEndLogo(2)
                        }
                    }
                } else {
                    console.log("Order3 setup not completed yet");
                    executionErrorLogo(2)
                }
            }).catch(function(err) {
            alert("接続用API設定を確認してください in order3");
        });

}

function service3Execution(service3, user_id, process_type) {
    var order_history_data;
    // console.log(service3);
    // console.log(service3.execution);
    if (service3.execution == 'api') {
        var checked_files = [];
        try {
            var files_of_checked_folder = fs.readdirSync(service3.check_folder_path + "/");
            // if (moved_files) {
            for (let k = 0; k < files_of_checked_folder.length; k++) {
                if (files_test(service3.check_folder_path + '/' + files_of_checked_folder[k])) {
                    checked_files.push(files_of_checked_folder[k])
                }
            }

        } catch (error) {
            console.log("Folder is empty");
            executionErrorLogo(2)
        }
        // console.log(checked_files);
        // return 0;
        if (checked_files.length > 0) {
            var file_lines = '';
            for (let i = 0; i < checked_files.length; i++) {
                if (files_test(service3.check_folder_path + '/' + checked_files[i])) {
                    var form = new FormData();
                    file_lines = alertCsvCount(service3.check_folder_path + '/' + checked_files[i])
                    file_data = alertCsvData(service3.check_folder_path + '/' + checked_files[i])
                        // console.log(file_lines);
                        // const stream = fs.createReadStream(service3.check_folder_path + '/' + checked_files[i]);
                    form.append('email', 'sakaki@jacos.co.jp');
                    form.append('password', 'sakaki');
                    form.append('scenario_id', '18');
                    form.append('number', file_lines);
                    form.append('keyword', checked_files[i]);
                    form.append('upfile', new Blob([file_data]), service3.check_folder_path + '/' + checked_files[i]);
                    // var file_name_for_api = checked_files[i];
                    const order3_request = new Request(service3.api_path, {
                        // const order3_request = new Request("http://localhost/level3_server/file_send_url", {
                        method: 'POST',
                        body: form
                    });
                    fetch(order3_request)
                        .then(response => response.json())
                        .then(data => {
                            fs.access(service3.moved_folder_path, fs.F_OK, (err) => {
                                if (err) {
                                    // console.log("May be move folder path is not valid");
                                    order_history_data = {
                                        process_type: process_type,
                                        user_id: user_id,
                                        service_id: (service3.service_id),
                                        status: 'Error',
                                        execute_name: '発注データ',
                                        history_message: "May be move folder path is not valid for order3"
                                    }
                                    historyCreate(order_history_data);
                                    return 0;
                                } else {
                                    moveFile(service3.check_folder_path, service3.moved_folder_path, data.up_file_name)
                                    var order_history_data = {
                                        process_type: process_type,
                                        user_id: user_id,
                                        service_id: (service3.service_id),
                                        status: 'Success',
                                        execute_name: '発注データ',
                                        history_message: "Order3 Job Executed Successfully"
                                    }
                                    historyCreate(order_history_data);
                                    executionEndLogo(2)
                                }

                            });
                        }).catch(function() {
                            executionErrorLogo(2)
                            console.log("接続用API設定を確認してください in Order3");
                            // scheduleMessageClassRemove('alert-danger', '接続用API設定を確認してください', 'alert-success');
                        });
                }

            }
        } else {
            // console.log('File not found');
            // console.log('ファイルが見つかりませんでした。');
            fs.access(service3.check_folder_path, fs.F_OK, (err) => {
                console.log(err);
                if (err) {
                    order_history_data = {
                        process_type: process_type,
                        user_id: user_id,
                        service_id: (service3.service_id),
                        status: 'Error',
                        execute_name: '発注データ',
                        history_message: "May be check folder path is not valid or it is empty for order3"
                    }
                    historyCreate(order_history_data);
                }
            });
            executionEndLogo(2)
        }
        checked_files = [];
    } else {
        console.log("Batch not allow for this job");
        order_history_data = {
            process_type: process_type,
            user_id: user_id,
            service_id: (service3.service_id),
            status: 'Error',
            execute_name: '発注データ',
            history_message: "Batch not allow for this job in order3"
        }
        historyCreate(order_history_data);
        executionEndLogo(2);
    }

    // files = [];
}
// Service4
function service4Process(service_id = null, process_type = "Auto") {
    // console.log("Job4 executing...");
    executionStartLogo(3)
    var customer_name = $('#customer_name_view').html();
    var user_id = $('#user_id').val();
    var shipment_history_data = '';
    var service_id = $("#service_info_table > tbody > tr:eq(3)").attr('service-id')
    if (!service_id) {
        // alertMessageClassRemove('alert-danger', 'Please add 3 shipment job for the customer: ' + customer_name, 'alert-success');
        console.log("No service ID found for Shipment1");
        executionErrorLogo(3)
        return 0;
    }
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = { service_id: service_id, service: 4 }

    requestUrl(get_service_data_url, body_data).then(res => res.json())
        .then(
            json => {
                var service4 = json.service4;
                if (!jQuery.isEmptyObject(service4)) {

                    requestUrl(service4.api_url, {}).then(res => res.json())
                        .then(
                            json => {
                                // console.log(json.file_found);
                                // return 0;
                                if (json.file_found) {
                                    fs.access(service4.api_folder_path, fs.F_OK, (err) => {
                                        if (err) {
                                            // console.log("May be API folder path is not valid");
                                            shipment_history_data = {
                                                process_type: process_type,
                                                user_id: user_id,
                                                service_id: (service4.service_id),
                                                status: 'Error',
                                                execute_name: '確定データ',
                                                history_message: "May be API folder path is not valid for Shipment1"
                                            }
                                            historyCreate(order_history_data);
                                            executionEndLogo(3);
                                            return 0;
                                        } else {
                                            file_save_from_url(json.file_name, json.file_path, service4.api_folder_path);
                                            shipment_history_data = {
                                                process_type: process_type,
                                                user_id: user_id,
                                                service_id: (service4.service_id),
                                                status: 'Success',
                                                execute_name: '確定データ',
                                                history_message: "Shipment1 Job Executed Successfully"
                                            }
                                            historyCreate(shipment_history_data);
                                            executionEndLogo(3);
                                        }
                                    })
                                } else {
                                    console.log("No file found in API for shipment1");
                                    executionEndLogo(3)
                                }

                            }).catch(function() {
                            console.log("接続用API設定を確認してください for shipment1");
                            executionErrorLogo(3)
                                // scheduleMessageClassRemove('alert-danger', 'Please check your API URL or Internet connection', 'alert-success');
                        });
                } else {
                    console.log("Shipment1 setup not completed yet");
                    executionErrorLogo(3)
                }
            })

}
// Service5
function service5Process(service_id = null, process_type = "Auto") {
    // console.log("Job5 executing...");
    executionStartLogo(4)
    var customer_name = $('#customer_name_view').html();
    var user_id = $('#user_id').val();
    var service_id = $("#service_info_table > tbody > tr:eq(4)").attr('service-id')
    if (!service_id) {
        // alertMessageClassRemove('alert-danger', 'Please add 3 shipment job for the customer: ' + customer_name, 'alert-success');
        console.log("No service ID found for Shipment2");
        executionErrorLogo(4)
        return 0;
    }
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = { service_id: service_id, service: 5 }

    requestUrl(get_service_data_url, body_data).then(res => res.json())
        .then(
            json => {
                var service5 = json.service5;
                // console.log(service5);
                if (!jQuery.isEmptyObject(service5)) {
                    if (process_type == "Manual") {
                        service5Execution(service5, user_id, process_type);
                    } else {
                        if (service5.job_execution_flag) {
                            service5Execution(service5, user_id, process_type);
                        } else {
                            console.log("Job execution off for shipment2");
                            executionEndLogo(4)
                        }
                    }
                } else {
                    console.log("Shipment2 setup not completed yet");
                    executionErrorLogo(4)
                }
            }).catch(function(err) {
            console.log(err);
            alert("接続用API設定を確認してください for Shipment2");
        });

}

function service5Execution(service5, user_id, process_type) {
    var shipment_history_data;
    // console.log(service5);
    if (service5.execution == 'batch') {
        var files_of_job5 = [];
        try {
            var files_of_folder_job5 = fs.readdirSync(service5.check_folder_path + "/");
            // if (files) {
            for (let j = 0; j < files_of_folder_job5.length; j++) {
                if (files_test(service5.check_folder_path + '/' + files_of_folder_job5[j])) {
                    files_of_job5.push(files_of_folder_job5[j])
                }
            }

        } catch (error) {
            console.log("Folder is empty");
            executionErrorLogo(4)
        }
        if (files_of_job5.length) {
            fs.access(service5.batch_file_path, fs.F_OK, (err) => {
                if (err) {
                    // console.log("May be batch file or path is not valid");
                    shipment_history_data = {
                        process_type: process_type,
                        user_id: user_id,
                        service_id: (service5.service_id),
                        status: 'Error',
                        execute_name: '確定データ',
                        history_message: "May be batch file or path is not valid for Shipment2"
                    }
                    historyCreate(shipment_history_data);
                    executionEndLogo(4);
                    return 0;
                } else {
                    shell.openItem(service5.batch_file_path);
                    shipment_history_data = {
                        process_type: process_type,
                        user_id: user_id,
                        service_id: (service5.service_id),
                        status: 'Success',
                        execute_name: '確定データ',
                        history_message: "Shipment2 Job Executed Successfully"
                    }
                    historyCreate(shipment_history_data);
                    executionEndLogo(4);
                }
            })
        } else {
            fs.access(service5.check_folder_path, fs.F_OK, (err) => {
                console.log(err);
                if (err) {
                    shipment_history_data = {
                        process_type: process_type,
                        user_id: user_id,
                        service_id: (service5.service_id),
                        status: 'Error',
                        execute_name: '確定データ',
                        history_message: "May be check folder path is not valid or it is empty for Shipment2"
                    }
                    historyCreate(shipment_history_data);
                }
            });
            executionEndLogo(4)
        }
    } else {
        // console.log("API not allow for this job")
        shipment_history_data = {
            process_type: process_type,
            user_id: user_id,
            service_id: (service5.service_id),
            status: 'Error',
            execute_name: '確定データ',
            history_message: "API not allow for this job in Shipment2"
        }
        historyCreate(shipment_history_data);
    }

}
// Service6 
function service6Process(service_id = null, process_type = "Auto") {
    // console.log("Job6 executing...");
    executionStartLogo(5)
    var customer_name = $('#customer_name_view').html();
    var user_id = $('#user_id').val();
    var service_id = $("#service_info_table > tbody > tr:eq(5)").attr('service-id')
    if (!service_id) {
        // alertMessageClassRemove('alert-danger', 'Please add 3 shipment job for the customer: ' + customer_name, 'alert-success');
        console.log("No service ID found for Shipment3");
        executionErrorLogo(5)
        return 0;
    }
    var get_service_data_url = properties.get('get_service_data_url');
    var body_data = { service_id: service_id, service: 6 }

    requestUrl(get_service_data_url, body_data).then(res => res.json())
        .then(
            json => {
                var service6 = json.service6;
                if (!jQuery.isEmptyObject(service6)) {
                    if (process_type == "Manual") {
                        service6Execution(service6, user_id, process_type);
                    } else {
                        if (service6.job_execution_flag) {
                            service6Execution(service6, user_id, process_type);
                        } else {
                            console.log("Job execution off for shipment3");
                            executionEndLogo(5)
                        }
                    }
                } else {
                    console.log("Shipment3 setup not completed yet");
                    executionErrorLogo(5)
                }
            }).catch(function(err) {
            alert("接続用API設定を確認してください for Shipment3");
        });

}

function service6Execution(service6, user_id, process_type) {
    var shipment_history_data;
    if (service6.execution == 'batch') {
        var files_of_job6 = [];
        try {
            var files_of_folder_job6 = fs.readdirSync(service6.check_folder_path + "/");
            // if (files) {
            for (let k = 0; k < files_of_folder_job6.length; k++) {
                if (files_test(service6.check_folder_path + '/' + files_of_folder_job6[k])) {
                    files_of_job6.push(files_of_folder_job6[k])
                }
            }

        } catch (error) {
            console.log("Folder is empty");
            executionErrorLogo(5)
        }
        if (files_of_job6.length) {
            fs.access(service6.batch_file_path, fs.F_OK, (err) => {
                if (err) {
                    // console.log("May be batch file or path is not valid");
                    shipment_history_data = {
                        process_type: process_type,
                        user_id: user_id,
                        service_id: (service6.service_id),
                        status: 'Error',
                        execute_name: '確定データ',
                        history_message: "May be batch file or path is not valid for Shipment2"
                    }
                    historyCreate(shipment_history_data);
                    executionEndLogo(5);
                    return 0;
                } else {
                    shell.openItem(service6.batch_file_path);
                    shipment_history_data = {
                        process_type: process_type,
                        user_id: user_id,
                        service_id: (service6.service_id),
                        status: 'Success',
                        execute_name: '確定データ',
                        history_message: "Shipment3 Job Executed Successfully"
                    }
                    historyCreate(shipment_history_data);
                    executionEndLogo(5);
                }
            })
        } else {
            fs.access(service6.check_folder_path, fs.F_OK, (err) => {
                // console.log(err);
                if (err) {
                    shipment_history_data = {
                        process_type: process_type,
                        user_id: user_id,
                        service_id: (service6.service_id),
                        status: 'Error',
                        execute_name: '確定データ',
                        history_message: "May be check folder path is not valid or it is empty for Shipment3"
                    }
                    historyCreate(shipment_history_data);
                }
            });
            executionEndLogo(5)
        }
    } else if (service6.execution == 'api') {
        console.log("API not allow for this case");
        shipment_history_data = {
            process_type: process_type,
            user_id: user_id,
            service_id: (service6.service_id),
            status: 'Error',
            execute_name: '確定データ',
            history_message: "API not allow for this case for Shipment2"
        }
        historyCreate(shipment_history_data);
        executionErrorLogo(5)
    }
}

function executionStartLogo(row_number) {
    $('#service_info_table tbody tr:eq(' + row_number + ') td:eq(2)').html('<p style="">Running...</p>');
}

function executionErrorLogo(row_number) {
    $('#service_info_table tbody tr:eq(' + row_number + ') td:eq(2)').html('<p style="color:red;">Error...</p>');
}

function executionEndLogo(row_number) {
    $('#service_info_table tbody tr:eq(' + row_number + ') td:eq(2)').html('<i class="far fa-play-circle" style="font-size:30px;"></i>');
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
// function abortTimer() { // to be called when you want to stop the timer
//     clearInterval(tid);
//   }
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
    // console.log("In function: " + customer_id);
    // const request = require('request');
    // console.log(service_id);
    var user_id = $('#user_id').val();
    var user_data = { user_id: user_id, service_id: service_id };
    var get_schedule_data_url = properties.get('get_schedule_data_url');
    var getRpaData = axios.post(get_schedule_data_url, user_data);
    getRpaData.then(({ data }) => {
        // console.log(data);
        var file_path_info = data.file_path_info;
            var schedule_array = data.schedule_array;
            var job_info = data.job_info;
            // console.log(schedule_array[1].day);
            // return 0;
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
            // console.log(file_path_info.length);
            // file_path_info != null
            if (file_path_info.length!=0) {
                if (file_path_info['path_execution_flag'] == 1) {
                    $("#path_execution_flag").prop("checked", true);
                } else {
                    $("#path_execution_flag").prop("checked", false);
                }
                // if (file_path_info['shipment_patha_execution'] == 1) {
                //     $("#shipment_path_execute").prop("checked", true);
                // } else {
                //     $("#shipment_path_execute").prop("checked", false);
                // }
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
            // job_info != null ||
            if ( job_info.length!=0) {
                if (job_info['job_execution_flag'] == 1) {
                    $("#job_execution_flag").prop("checked", true);
                } else {
                    $("#job_execution_flag").prop("checked", false);
                }
                if (job_info['execution'] == 'api') {
                    // var scenario_html="";
                    // scenario_html+="<ul>"
                    // scenario_html+='<li>'+job_info.name+'</li>'
                    // scenario_html+="</ul>"
                    $(".scenario_list_show").html(job_info.name);
                } else if (job_info['execution'] == 'batch') {
                    $("#batch_execute").prop("checked", true);
                }
                $("#cmn_scenario_id").val(job_info['cmn_scenario_id']);
                $('#job_update_id').val(job_info['lv3_job_id']);
                $('#api_path').val(job_info['api_path']);
                $('#batch_file_path_box').val(job_info['batch_file_path']);
                // $('#shipment_file_path_box').val(file_path_info['shipment_path']);

            } else {
                $("#job_update_id").val('');
                $("#job_execution_flag").prop("checked", false);
                $(".scenario_list_show").html('No Scenario found');
                $("#cmn_scenario_id").val('');
                // $("#api_execute").prop("checked", false);
                $("#batch_execute").prop("checked", false);
                // $('#api_path').val('');
                $('#batch_file_path_box').val('');
                // $('#shipment_file_path_box').val('');
            }
            $('.loader').removeClass('d-block');
            $('.loader').addClass('d-none');
            // if (modal_val == "modal_show") {
            //     $('#schedule_modal').modal('show');
            // }
        }).catch(()=>{
            // console.log("Please check your API url or internet connection");
            console.log("接続用API設定を確認してください");
        });
}

function user_login() {
    // $('.load').addClass('d-block');
    var user_name = properties.get('user_name');
    var password = properties.get('password');
    var login_url = properties.get('login_url');
    if (user_name == null || user_name == '' || password == null || password == '') {
        alert("Email&Passwordがありません。properties.fileを確認してください。\n");
        window.close();
        return 0;
    } else {
        // API Data 
        // const request = require('request');
        var user_data = { user_name: user_name, password: password };
        var userLoginHit = axios.post(login_url, user_data);
        userLoginHit.then(({ data }) => {
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
        }).catch(()=>{
            alert("サーバーに接続できません。");
            window.close();
        });
        // API Data 
    }

    // });
}

// Text file read success function 
// function read_text_file(file_name) {
//     return new Promise(function(resolve, reject) {
//         var lines = {};
//         $.get(file_name, function(data) {

//             var users = {};
//             lines = data.split(",");
//             $.each(lines, function(key, value) {
//                 var prep = value.split("=");
//                 users[prep[0]] = prep[1];
//             });
//             resolve(users);

//         });
//     });
// }

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
    console.log(f);
    console.log(dest);
    // return 0;
    fs.rename(file_source_oath + "/" + moved_file_name, dest, (err) => {
        if (err) throw err;
        else console.log('ファイル移動が完了しました。');
    });
    // Copy file 
    //     fs.createReadStream(input_path + file).pipe(fs.createWriteStream(output_path + name + date + extension));

}

function fileNameChange(fileName) {
    var ext = checkFileExt(fileName);
    var file_name = checkFileName(fileName);
    return file_name + "_" + time_process(cur_time()) + "." + ext;
}

function checkFileExt(filename) {
    filename = filename.toLowerCase();
    // return filename.split('.').pop();
    var file_array = filename.split('.');
    return file_array[file_array.length - 1];
    // return file_array[nameOrExt];
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

function file_save_from_url(file_name, file_url, file_move_path) {
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
                        return
                    } else {
                        // console.log('Shipment File saved')
                        // console.log('納品ファイルが保存されました。')
                        console.log("File Saved");
                    }

                })
            }
            reader.readAsArrayBuffer(blob)
                // Direct File create with data 
                // try { fs.writeFileSync(file_move_path + '/' + file_name, "Hellow world", 'utf-8'); } catch (e) { alert('Failed to save the file !'); }

        })
        .catch(() => console.log('File can not be downloaded!'));
}

function customerInfo(user_id = null) {
    // var user_id = $('#user_id').val();
    var get_customer_url = properties.get('get_customer_url');
    var body_data = { user_id: user_id }
    var cusrUrlCall = axios.post(get_customer_url, body_data);
    // var cusrUrlCall = requestUrl(get_customer_url, body_data);
    cusrUrlCall.then(({ data }) => {
        // console.log(data)
        var customers_data = data.customers_data;
                var raw_html = '';
                for (let i = 0; i < customers_data.length; i++) {
                    // const element = array[i];
                    raw_html += '<tr class="cust_info_row" cmn_connect_id="' + customers_data[i].cmn_connect_id + '" adm_user_id="' + customers_data[i].adm_user_id + '" partner-code="' + customers_data[i].partner_code + '" company-name="' + customers_data[i].company_name + '">';
                    raw_html += '<td>' + (i + 1) + '</td>';
                    raw_html += '<td>' + customers_data[i].company_name + '</td>';
                    // raw_html += '<td>' + customers_data[i].partner_code + '</td>';
                    // raw_html += '<td style="text-align:center;" id="customer_edit_form"><i class="fas fa-cog"></i></td>';
                    raw_html += '</tr>';
                }
                $('#customer_info_table tbody').append(raw_html);
    }).catch(() => {
        alert("接続用API設定を確認してください");
    })
}

function requestUrl(api_url, body_data = null) {
    // body_data sample { user_id: user_id }
    var fval = fetch(api_url, {
        method: 'POST',
        body: JSON.stringify(body_data),
        headers: { 'Content-Type': 'application/json' },
    })
    return fval;
    // console.log(reqest_ulr);
}

function historyCreate(history_data) {
    var history_create_url = properties.get('history_create_url');
    requestUrl(history_create_url, history_data).then(res => res.json())
        .then(
            json => {
                // console.log(json);
                history();
            }).catch(function(err) {
            alert("接続用API設定を確認してください");
        });
}

function history() {
    var user_id = $('#user_id').val();
    var body_data = { user_id: user_id }
    var history_url = properties.get('history_url');
    axios.post(history_url,body_data).then(({ data }) => {
                histories = data.histories;
                var history_html = '';
                history_html += '<table class="table table-bordered" id="history_table">';
                history_html += '<thead>';
                // history_html = '<tr>';
                history_html += '<th>No</th>';
                history_html += '<th>取引先名</th>';
                history_html += '<th>サービス名</th>'; //Service Name
                history_html += '<th>実行履歴</th>'; //Executed
                history_html += '<th>実行種別</th>'; //Execute type
                history_html += '<th>ステータス</th>';
                history_html += '<th>日時</th>';
                // history_html = '</tr>';
                history_html += '</thead>';
                history_html += '<tbody>';
                var i = 1;
                histories.forEach(history => {
                    // console.log(history);
                    history_html += '<tr>';
                    history_html += '<td>' + i + '</td>';
                    history_html += '<td>' + history.company_name + '</td>';
                    history_html += '<td>' + history.service_name + '</td>';
                    history_html += '<td>' + history.execute_name + '</td>';
                    history_html += '<td>' + history.execute_type + '</td>';
                    history_html += '<td class="history_message" hist_message="' + history.message + '" style="text-align:center; font-size:30px;">' + (history.status == "Success" ? '<i class="fa fa-check-circle" aria-hidden="true"></i>' : '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>') + '</td>';
                    history_html += '<td>' + formatDate(new Date(history.updated_at)) + '</td>';
                    history_html += '</tr>';
                    i++;
                });
                history_html += '</tbody>';
                history_html += '</table>';
                // history_data_table.row.add(history_html).draw();;
                // $('#history_table tbody').html(history_html);
                // history_data_table.rows.add(history_html).draw();
                // console.log(history_html);
                $('#history_table_div').html(history_html);
                $('#history_table').DataTable({
                    "language": {
                        "url": "./js/DataTableJapaneseLanguage.json"
                    }
                });
                setTimeout(function() {
                    areRefresh();
                    // $('#area_refresh').click();
                    // $('#first_tab').click();
                    // console.log("Clicked");
                }, 1000);
            }).catch(()=> {
            alert("接続用API設定を確認してください");
        });

}

function formatDate(date) {
    return date.getFullYear() + '-' +
        length_fill(date.getMonth() + 1) + '-' +
        length_fill(date.getDate()) + ' ' +
        length_fill(date.getHours()) + ':' +
        length_fill(date.getMinutes()) + ':' +
        length_fill(date.getSeconds());
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

function areRefresh() {
    $("#tabs2").tabs({ active: 0 });
    $('.cust_info_row.bg-secondary').removeClass("bg-secondary text-white");

    var cmn_connect_id = $("#customer_info_table>tbody>tr:first").attr('cmn_connect_id');
    var adm_user_id = $("#customer_info_table>tbody>tr:first").attr('adm_user_id');
    var company_name = $("#customer_info_table>tbody>tr:first").attr('company-name');
    var partner_code = $("#customer_info_table>tbody>tr:first").attr('partner-code');
    $('#company_name_view').html(company_name);
    $('#partner_code_view').html(partner_code);
    $('#cmn_connect_id_for_schedule').val(cmn_connect_id);
    alertMessageClassRemove('', '', 'alert-danger');
    // $('#rpa_schedule_message').html('');
    // console.log(customer_id)
    $('.cust_info_row').attr('cmn_connect_id',cmn_connect_id).addClass('bg-secondary text-white');
    // $('#' + cmn_connect_id).addClass('bg-secondary text-white');
    serviceNameShow({cmn_connect_id:cmn_connect_id,adm_user_id:adm_user_id})
}

function serviceNameShow(get_service_parameters) {
    var show_service_url = properties.get('show_service_url');
    var serviceData = axios.post(show_service_url, get_service_parameters);
    serviceData.then(({ data }) => {
         var service_data = data.all_service_data;
         var raw_html = '';
         if (service_data.length) {
             // var raw_html = '';
             for (let i = 0; i < service_data.length; i++) {
                 // const element = array[i];
                 raw_html += '<tr class="service_info_row" remove_val="0" service-id="' + service_data[i].lv3_service_id + '" service-name="' + service_data[i].service_name + '">';
                 raw_html += '<td>' + (i + 1) + '</td>';
                 raw_html += '<td id="service_edit_form">' + service_data[i].service_name + '</td>';
                 raw_html += '<td style="text-align:center;" id="service_execution"><i class="far fa-play-circle" style="font-size:30px;"></i></td>';
                 raw_html += '<td style="text-align:center;" id="service_configureation"><i class="fas fa-cog" style="font-size:30px;"></i></td>';
                 raw_html += '</tr>';
             }
         } else {
             raw_html = '<tr remove_val="1"><td colspan="4">No data found</td></tr>';
             // raw_html = 'No data found';
         }

         $('#service_info_table tbody').html(raw_html);
         if (service_data.length) {
             rpa_schedule_show(service_data[0].lv3_service_id);
         }
        }).catch(()=>{
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