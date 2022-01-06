class ez5.CoinViewerDetailPlugin extends DetailSidebarPlugin

	@JSON_EXTENSION = "json"

	getButtonLocaKey: ->
		"coin.viewer.main.button"

	prefName: ->
		"coin.viewer.pref"

	getPane: ->
		return "top"

	isAvailable: ->
		assets = @_detailSidebar.object.getAssetsForBrowser(["detail", "standard"])
		return assets.some((asset) =>
			asset.value.extension == ez5.CoinViewerDetailPlugin.JSON_EXTENSION and Asset.getDownloadVersions(asset.value).length > 0
		)

	isDisabled: ->
		return false

	showDetail: ->
		CUI.dom.empty(@__mainDiv)
		waitBlock = new CUI.WaitBlock
			element: @__mainDiv
		waitBlock.show()
		@_detailSidebar.mainPane.replace(@__mainDiv, @getPane())

		# We need to add the token so we can download the json files.
		serverToken = ez5.session.token
		headers = {}
		if ez5.version("6.1")
			headers["Authorization"] = "Bearer " + serverToken
		else
			headers["X-Easydb-Token"] = serverToken

		validJsonFilesFound = []

		promises = []
		assets = @_detailSidebar.object.getAssetsForBrowser(["detail", "standard"])
		for asset in assets
			if asset.value.extension != ez5.CoinViewerDetailPlugin.JSON_EXTENSION
				continue

			downloadVersions = Asset.getDownloadVersions(asset.value)
			for downloadVersion in downloadVersions
				downloadUrl = downloadVersion.url or downloadVersion.download_url
				if downloadUrl
					break

			if not downloadUrl
				continue

			deferred = new CUI.Deferred()
			do(deferred) =>
				downloadXHR = new CUI.XHR
					url: downloadUrl
					method: "GET"
					headers: headers
				promise = downloadXHR.start()
				promise.done((jsonData)=>
					if @__isValidJsonData(jsonData)
						validJsonFilesFound.push(jsonData)
					deferred.resolve()
				).fail(deferred.reject)

				promises.push(deferred.promise())

		CUI.whenAll(promises).done(=>
			if validJsonFilesFound.length == 0
				wrongJsonLabel = new LocaLabel(loca_key: "coin.viewer.main.error.json_wrong_data", centered: true, multiline: true)
				CUI.dom.replace(@__mainDiv, wrongJsonLabel)
				return

			@__openCoinViewer(validJsonFilesFound)
			waitBlock.hide()
		)

		return

	renderObject: ->
		@__mainDiv = CUI.dom.div("ez5-coin-viewer-container")
		return

	__openCoinViewer: (jsonFiles) ->
		coinData = jsonFiles[0] # For now we use the first one found.
		ez5.CoinLib.init(@__mainDiv)
		ez5.CoinLib.show(coinData)
		return

	# Example of .json file
	#	{
	#		"processData": {
	#			"coinSide0": {
	#				"albedo": "(base-64 image)",
	#				"normal": "(base-64 image)"
	#			},
	#			"coinSide1": {
	#				"albedo": "(base-64 image)",
	#				"normal": "(base-64 image)"
	#			}
	#		},
	#		"userData": {
	#			"coinSideData0": {
	#				"intensity": 1.5,
	#				"lightDirectionX": 0.57735002040863037,
	#				"lightDirectionY": -0.57735002040863037,
	#				"lightDirectionZ": -0.57735002040863037,
	#				"rotation": 0
	#			},
	#			"coinSideData1": {
	#				"intensity": 1.5,
	#				"lightDirectionX": 0.57735002040863037,
	#				"lightDirectionY": -0.57735002040863037,
	#				"lightDirectionZ": -0.57735002040863037,
	#				"rotation": 0
	#			},
	#			"coinSideRotation": "Vertical"
	#		}
	#	}
	__isValidJsonData: (jsonData) ->
		if not CUI.util.isPlainObject(jsonData)
			return false

		if not CUI.util.isPlainObject(jsonData.processData)
			return false

		for _, value of jsonData.processData
			if not CUI.util.isPlainObject(value)
				return false

			if not value.albedo or not value.normal
				return false

		return true

ez5.session_ready ->
	DetailSidebar.plugins.registerPlugin(ez5.CoinViewerDetailPlugin)
	return