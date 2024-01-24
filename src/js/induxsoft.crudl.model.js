var InduxsoftCrudlModel =
{
	async InvokeService(url, data, success, fail, method='GET', reload=true, async=true, autorizations='', formdata=false, beforeFetch=null) 
	{
		let fetchData = {
			method: method,
			mode: 'cors',
			headers: {
				'Access-Control-Allow-Origin': '*'
			}
		}

		if (autorizations) fetchData.headers['Authorization'] = autorizations;
		
		if (data) {
			if (formdata)
				fetchData['body'] = data;
			else {
				fetchData.headers['Content-Type'] = 'application/json';
				fetchData['body'] = JSON.stringify(data);
			}
		}

		const resHandler = res => {
			if (method.toUpperCase() == "DELETE" && (res == null || res == 'undefined')) {
				success(res);
			}
			else {
				const isJson = res.headers.get('content-type')?.includes('application/json');
				if (isJson) {
					res.json().then(json => {
						if (json.success && success) {
							success(json.data ?? json);
						}
						else if (!json.success && json.success != null && json.success != undefined && fail) {
							fail(json);
						}
						else {
							if (res.status >= 200 && res.status < 300 && success) {
								success(json);
							}
							else {
								if (fail) fail(json);
							}
						}
					}).catch(error => success(error));
				}
				else {
					success(res);
				}
			}

			if (reload)
				window.location.reload();
		}

		if (beforeFetch) beforeFetch(fetchData);

		if (async) {
			await fetch(url, fetchData).then(resHandler).catch(error => {
				if (fail) fail(error.message ?? JSON.stringify(error));
			});
		}
		else {
			fetch(url, fetchData).then(resHandler).catch(error => {
				if (fail) fail(error.message ?? JSON.stringify(error));
			});
		}
	},

	UrlReplace(url, params)
	{
		let url_sect = url.split('?');
		let url_base = url_sect[0];
		let url_prms = '';
		let url_new = url_base;
		let new_parms = '';

		if (url_sect.length > 0) url_prms = url_sect[1];
		if (!params) params = {};

		if (url_prms != '')
		{
			let keyvalues = url_prms.split('&');
			keyvalues.forEach((kv,i) => {
				let kvl = kv.split('=');
				let key = kvl[0];
				let val = (params[key] ?? (kvl.length > 0 ? kvl[1] : ''));
				new_parms += (i==0?'?':'&') + key + '=' + val;
			});
		}

		url_new += new_parms;
		return url_new;
	},

	Delete(id, url="") {
		if ((typeof id === "number" && id <= 0) || (typeof id === "string" && id.trim() == "")) {
            console.error("Debe indicar un identificador válido");
            return;
        }
		if (!confirm("¿Desea eliminar el registro seleccionado?")) return;

		let endpoint = (url) ? url.replace("{id}",id) : "./"+id+"/";

		this.InvokeService(endpoint, null,
			function (data) {
				window.location.reload();
			},
			function (error) {
				if (error.message) alert(error.message);
				else console.error(error);
			}, "DELETE", false, false
		);
	}
}