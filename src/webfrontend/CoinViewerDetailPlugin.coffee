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
			asset.value.extension == ez5.CoinViewerDetailPlugin.JSON_EXTENSION
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
		if not ez5.version("6")
			headers["X-Easydb-Token"] = serverToken

		validJsonFilesFound = []

		promises = []
		assets = @_detailSidebar.object.getAssetsForBrowser(["detail", "standard"])
		for asset in assets
			if asset.value.extension != ez5.CoinViewerDetailPlugin.JSON_EXTENSION
				continue

			for _, _version of asset.value.versions or []
				downloadUrl = _version.url or _version.download_url
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

			pane = new CUI.SimplePane
				class: "ez5-coin-viewer-pane"
				content: [@__buttonBar, @__mainDiv, @__buttonBarInteraction]
			@_detailSidebar.mainPane.replace(pane, @getPane())
			@__openCoinViewer(validJsonFilesFound)
			waitBlock.hide()
		)

		return

	renderObject: ->
		@__mainDiv = CUI.dom.div("ez5-coin-viewer-container")

		fullscreenButton = CUI.Pane.getToggleFillScreenButton(
			icon_inactive: new CUI.Icon(icon: $$("coin.viewer.buttonbar.fullscreen.button.open|icon"))
			icon_active: new CUI.Icon(icon: $$("coin.viewer.buttonbar.fullscreen.button.close|icon"))
			tooltip: text: $$("coin.viewer.buttonbar.fullscreen.button|tooltip")
		)

		@__buttonBar = new CUI.Buttonbar
			class: "ez5-coin-viewer-buttonbar"
			buttons: [fullscreenButton]		

		@__buttonBarInteraction = new CUI.Buttonbar
			class: "ez5-coin-viewer-interaction-buttonbar"			
			buttons: @__getInteractionButtons()

		return

	__getInteractionButtons: ->	
		iconLookupTable = { 
			IconResetView: "fa-undo",
			IconZoomOut: "fa-search-minus",
			IconZoomIn: "fa-search-plus",
			IconRotateLeft: "fa-rotate-left",
			IconRotateRight: "fa-rotate-right",
			IconMoveObjectOrLight: ["fa-sun-o", "fa-arrows"],
			IconSelectColor: "fa-tint",
			IconRule: "ruler",
			IconFlip: "fa-exchange"
		}

		tooltipLookupTable = { 
			IconResetView: "Reset view, light direction an object color.",
			IconZoomOut: "Zoom out.",
			IconZoomIn: "Zoom in.",
			IconRotateLeft: "Counter-clockwise object rotation.",
			IconRotateRight: "Clockwise object rotation.",
			IconMoveObjectOrLight: "Toggle manipulation of light or object position.",
			IconSelectColor: "Choose custom color for the object.",
			IconRule: "Toggle visualization of scale.",
			IconFlip: "Show other object side."
		}		

		buttons = []

		for k, v of iconLookupTable
			button = new CUI.Button
				class: "ez5-coin-viewer-button"
				icon_inactive: if CUI.util.isArray(v) then v[0] else v
				icon_active: if CUI.util.isArray(v) then v[1] else v
				hidden: true
				tooltip: text: tooltipLookupTable[k]
			CUI.dom.setAttribute(button, "data-action", k)
			buttons.push(button)

		return buttons

	__openCoinViewer: (jsonFiles) ->
		coinData = jsonFiles[0] # For now we use the first one found.
		useFylrButtons = true # if set to true it will override the default webGL buttons with Fylr styled HTML buttons
		ez5.CoinLib.init(@__mainDiv, useFylrButtons)
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

			if not value.albedo or not value.normal
				return false

		return true

ez5.session_ready ->
	DetailSidebar.plugins.registerPlugin(ez5.CoinViewerDetailPlugin)
	return
