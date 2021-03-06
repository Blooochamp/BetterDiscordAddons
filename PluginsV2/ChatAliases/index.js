module.exports = (Plugin, Api, Vendor) => {
	if (typeof BDfunctionsDevilBro !== "object") global.BDfunctionsDevilBro = {$: Vendor.$, BDv2Api: Api};
	
	const {$} = Vendor;

	return class extends Plugin {
		onStart() {
			var libraryScript = null;
			if (typeof BDfunctionsDevilBro !== "object" || typeof BDfunctionsDevilBro.isLibraryOutdated !== "function" || BDfunctionsDevilBro.isLibraryOutdated()) {
				libraryScript = document.querySelector('head script[src="https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDfunctionsDevilBro.js"]');
				if (libraryScript) libraryScript.remove();
				libraryScript = document.createElement("script");
				libraryScript.setAttribute("type", "text/javascript");
				libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDfunctionsDevilBro.js");
				document.head.appendChild(libraryScript);
			}
			this.startTimeout = setTimeout(() => {this.initialize();}, 30000);
			if (typeof BDfunctionsDevilBro === "object" && typeof BDfunctionsDevilBro.isLibraryOutdated === "function") this.initialize();
			else libraryScript.addEventListener("load", () => {this.initialize();});
			return true;
		}
		
		initialize() {
			if (typeof BDfunctionsDevilBro === "object") {
				this.configtypes = ["case","exact","autoc","regex","file"];
		
				this.defaults = {
					settings: {
						addAutoComplete:	{value:true, 	description:"Add an Autocomplete-Menu for Non-Regex Aliases:"}
					}
				};
				
				BDfunctionsDevilBro.loadMessage(this);
				
				this.UploadModule = BDfunctionsDevilBro.WebModules.findByProperties(["instantBatchUpload"]);
				this.CurrentUserPerms = BDfunctionsDevilBro.WebModules.findByProperties(["getChannelPermissions", "can"]);
				this.Permissions = BDfunctionsDevilBro.WebModules.findByProperties(["Permissions", "ActivityTypes"]).Permissions;

				var observer = null;

				observer = new MutationObserver((changes, _) => {
					changes.forEach(
						(change, i) => {
							if (change.addedNodes) {
								change.addedNodes.forEach((node) => {
									if (node && node.tagName && node.querySelector(".innerEnabled-gLHeOL, .innerEnabledNoAttach-36PpAk")) {
										this.bindEventToTextArea(node.querySelector("textarea"));
									}
								});
							}
						}
					);
				});
				BDfunctionsDevilBro.addObserver(this, ".appMount-14L89u", {name:"textareaObserver",instance:observer}, {childList: true, subtree:true});
				
				// PATCH OLD DATA REMOVE SOON
				let aliases = BDfunctionsDevilBro.loadAllData(this, "words");
				for (let alias in aliases) {
					aliases[alias].autoc = aliases[alias].autoc == undefined ? !aliases[alias].regex : aliases[alias].autoc;
				}
				BDfunctionsDevilBro.saveAllData(aliases, this, "words");
				
				document.querySelectorAll("textarea").forEach(textarea => {this.bindEventToTextArea(textarea);});
			
				$(document).off("click." + this.name).on("click." + this.name, (e) => {
					if (!e.target.tagName === "TEXTAREA") $(".autocompleteAliases, .autocompleteAliasesRow").remove();
				});
			
				return true;
			}
			else {
				console.error(this.name + ": Fatal Error: Could not load BD functions!");
				return false;
			}
		}

		onStop() {
			if (typeof BDfunctionsDevilBro === "object") {				
				BDfunctionsDevilBro.unloadMessage(this);
				return true;
			}
			else {
				return false;
			}
		}


		// begin of own functions

		updateSettings (settingspanel) {
			var settings = {};
			for (var input of settingspanel.querySelectorAll(".checkbox-1KYsPm")) {
				settings[input.value] = input.checked;
			}
			BDfunctionsDevilBro.saveAllData(settings, this, "settings");
			
			document.querySelectorAll("textarea").forEach(textarea => {this.bindEventToTextArea(textarea);});
		}

		updateContainer (settingspanel, ele) {
			var update = false, wordvalue = null, replacevalue = null;
			var action = ele.getAttribute("action");
			var words = BDfunctionsDevilBro.loadAllData(this, "words");

			if (action == "add") {
				var wordinput = settingspanel.querySelector("#input-wordvalue");
				var replaceinput = settingspanel.querySelector("#input-replacevalue");
				var fileselection = settingspanel.querySelector("#input-file");
				wordvalue = wordinput.value;
				replacevalue = replaceinput.value;
				if (wordvalue && wordvalue.trim().length > 0 && replacevalue && replacevalue.trim().length > 0) {
					wordvalue = wordvalue.trim();
					replacevalue = replacevalue.trim();
					var filedata = null;
					var fs = require("fs");
					if (fileselection.files && fileselection.files[0] && fs.existsSync(replacevalue)) {
						filedata = JSON.stringify({
							data: fs.readFileSync(replacevalue).toString("base64"),
							name: fileselection.files[0].name,
							type: fileselection.files[0].type
						});
					}
					words[wordvalue] = {
						replace: replacevalue,
						filedata: filedata,
						case: false,
						exact: wordvalue.indexOf(" ") == -1,
						autoc: true,
						regex: false,
						file: filedata != null
					};
					wordinput.value = null;
					replaceinput.value = null;
					update = true;
				}
			}
			else if (action == "remove") {
				wordvalue = ele.getAttribute("word");
				if (wordvalue) {
					delete words[wordvalue];
					update = true;
				}
			}
			else if (action == "removeall") {
				if (confirm("Are you sure you want to remove all added Words from your list?")) {
					words = {};
					update = true;
				}
			}
			if (update) {
				BDfunctionsDevilBro.saveAllData(words, this, "words");
				words = BDfunctionsDevilBro.loadAllData(this, "words");

				var containerhtml = ``;
				for (let word in words) {
					containerhtml += `<div class="flex-lFgbSz flex-3B1Tl4 vertical-3X17r5 flex-3B1Tl4 directionColumn-2h-LPR justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO marginTop4-2rEBfJ marginBottom4-_yArcI card-11ynQk"><div class="card-11ynQk-inner"><input type="text" word="${word}" action="edit" class="game-name game-name-input word-name" value="${BDfunctionsDevilBro.encodeToHTML(word)}"><input type="text" word="${word}" action="edit" class="game-name game-name-input replace-name" value="${BDfunctionsDevilBro.encodeToHTML(words[word].replace)}">`;
					for (let config of this.configtypes) {
						containerhtml += `<div class="checkboxContainer-1sZ9eo marginReset-2tTc4H" style="flex: 0 0 auto;"><label class="checkboxWrapper-2Yvr_Y"><input word="${word}" config="${config}" type="checkbox" class="inputDefault-2tiBIA input-oWyROL"${words[word][config] ? " checked" : ""}><div class="checkbox-1QwaS4 center-1MLNrE flex-3B1Tl4 justifyStart-2yIZo0 alignCenter-3VxkQP round-30vw42"><svg name="Checkmark" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><polyline stroke="transparent" stroke-width="2" points="3.5 9.5 7 13 15 5"></polyline></g></svg></div></label></div>`;
					}
					containerhtml += `</div><div word="${word}" action="remove" class="button-1qrA-N remove-word"></div></div>`;
				}
				$(settingspanel).find(".alias-list").html(containerhtml);
				BDfunctionsDevilBro.initElements(settingspanel);
			}
		}

		updateWord (ele) {
			clearTimeout(ele.updateTimeout);
			ele.updateTimeout = setTimeout(() => {
				var card = ele.parentElement.parentElement;
				var words = BDfunctionsDevilBro.loadAllData(this, "words");
				var oldwordvalue = ele.getAttribute("word");
				if (oldwordvalue && words[oldwordvalue]) {
					var wordinput = card.querySelector(".word-name");
					var replaceinput = card.querySelector(".replace-name");
					var removebutton = card.querySelector(".remove-word");
					var newwordvalue = wordinput.value;
					var newreplacevalue = replaceinput.value;
					wordinput.setAttribute("word", newwordvalue);
					wordinput.setAttribute("value", newwordvalue);
					replaceinput.setAttribute("word", newwordvalue);
					replaceinput.setAttribute("value", newreplacevalue);
					removebutton.setAttribute("word", newwordvalue);
					words[newwordvalue] = words[oldwordvalue];
					words[newwordvalue].replace = newreplacevalue;
					if (newwordvalue != oldwordvalue) delete words[oldwordvalue];
					BDfunctionsDevilBro.saveAllData(words, this, "words");
				}
			},500);
		}

		updateConfig (ele) {
			var words = BDfunctionsDevilBro.loadAllData(this, "words");
			var wordvalue = ele.getAttribute("word");
			var config = ele.getAttribute("config");
			if (wordvalue && words[wordvalue] && config) {
				words[wordvalue][config] = ele.checked;
				BDfunctionsDevilBro.saveAllData(words, this, "words");
			}
		}

		toggleInfo (settingspanel, ele) {
			ele.classList.toggle("wrapperCollapsed-18mf-c");
			ele.classList.toggle("wrapperDefault-1Dl4SS");
			var svg = ele.querySelector(".iconTransition-VhWJ85");
			svg.classList.toggle("closed-2Hef-I");
			svg.classList.toggle("iconCollapsed-1INdMX");
			svg.classList.toggle("iconDefault-xzclSQ");

			var visible = $(settingspanel).find(".info-container").is(":visible");
			$(settingspanel).find(".info-container").toggle(!visible);
			BDfunctionsDevilBro.saveData("hideInfo", visible, this, "hideInfo");
		}

		bindEventToTextArea (textarea) {
			if (!textarea) return;
			var channelObj = BDfunctionsDevilBro.getSelectedChannel();
			var channel = channelObj ? channelObj.data : null;
			if (!channel) return;
			var settings = BDfunctionsDevilBro.getAllData(this, "settings"); 
			$(textarea)
				.off("input." + this.name)
				.on("input." + this.name, () => {
					if (this.format) {
						this.format = false;
						textarea.focus();
						textarea.selectionStart = 0;
						textarea.selectionEnd = textarea.value.length;
						if (document.activeElement == textarea) {
							var messageInput = this.formatText(textarea.value);
							if (messageInput && messageInput.text != null) {
								document.execCommand("insertText", false, messageInput.text ? messageInput.text + " " : "");
							}
							if (messageInput && messageInput.files.length > 0 && (channel.type == 1 || this.CurrentUserPerms.can(this.Permissions.ATTACH_FILES, channel))) {
								this.UploadModule.instantBatchUpload(channel.id, messageInput.files);
							}
						}
					}
				})
				.off("keydown." + this.name)
				.on("keydown." + this.name, e => {
					if (e.which == 9) {
						let selectedChatAlias = textarea.parentElement.querySelector(".autocompleteAliasesRow .selectorSelected-2M0IGv")
						if (selectedChatAlias) {
							e.preventDefault();
							e.stopPropagation();
							this.swapWordWithAlias(textarea);
						}
					}
					else if (!e.ctrlKey && e.which != 38 && e.which != 40) {
						if (!(e.which == 39 && textarea.selectionStart == textarea.selectionEnd && textarea.selectionEnd == textarea.value.length)) {
							$(".autocompleteAliases, .autocompleteAliasesRow").remove();
						}
					}
					
					if (textarea.value && !e.shiftKey && e.which == 13 && !textarea.parentElement.querySelector(".autocomplete-1TnWNR")) {
						this.format = true;
						$(textarea).trigger("input");
					}
					else if (!e.ctrlKey && settings.addAutoComplete && textarea.selectionStart == textarea.selectionEnd && textarea.selectionEnd == textarea.value.length) {
						setImmediate(() => {this.addAutoCompleteMenu(textarea);});
					}
				})
				.off("click." + this.name)
				.on("click." + this.name, e => {
					if (settings.addAutoComplete && textarea.selectionStart == textarea.selectionEnd && textarea.selectionEnd == textarea.value.length) {
						setImmediate(() => {this.addAutoCompleteMenu(textarea);});
					}
				});
		}

		addAutoCompleteMenu (textarea) {
			if (textarea.parentElement.querySelector(".autocompleteAliasesRow")) return;
			let words = textarea.value.split(" ");
			let lastword = words[words.length-1].trim();
			if (words.length == 1 && BDfunctionsDevilBro.isPluginEnabled("WriteUpperCase")) {
				let first = lastword.charAt(0);
				if (first === first.toUpperCase() && lastword.toLowerCase().indexOf("http") == 0) {
					lastword = lastword.charAt(0).toLowerCase() + lastword.slice(1);
				}
				else if (first === first.toLowerCase() && first !== first.toUpperCase() && lastword.toLowerCase().indexOf("http") != 0) {
					lastword = lastword.charAt(0).toUpperCase() + lastword.slice(1);
				}
			}
			if (lastword) {
				let aliases = BDfunctionsDevilBro.loadAllData(this, "words"), matchedaliases = {};
				for (let alias in aliases) {
					let aliasdata = aliases[alias];
					if (!aliasdata.regex && aliasdata.autoc) {
						if (aliasdata.exact) {
							if (aliasdata.case && alias.indexOf(lastword) == 0) matchedaliases[alias] = aliasdata;
							else if (!aliasdata.case && alias.toLowerCase().indexOf(lastword.toLowerCase()) == 0) matchedaliases[alias] = aliasdata;
						}
						else {
							if (aliasdata.case && alias.indexOf(lastword) > -1) matchedaliases[alias] = aliasdata;
							else if (!aliasdata.case && alias.toLowerCase().indexOf(lastword.toLowerCase()) > -1) matchedaliases[alias] = aliasdata;
						}
					}
				}
				if (!BDfunctionsDevilBro.isObjectEmpty(matchedaliases)) {
					let autocompletemenu = textarea.parentElement.querySelector(".autocomplete-1TnWNR .autocompleteInner-N7OQf1"), amount = 15;
					if (!autocompletemenu) {
						autocompletemenu = $(`<div class="autocomplete-1TnWNR autocomplete-1LLKUa autocompleteAliases"><div class="autocompleteInner-N7OQf1"></div></div>`)[0];
						textarea.parentElement.appendChild(autocompletemenu);
						autocompletemenu = autocompletemenu.firstElementChild;
					}
					else {
						amount -= autocompletemenu.querySelectorAll(".selectable-3iSmAf").length;
					}
					
					$(autocompletemenu)
						.append(`<div class="autocompleteRowVertical-3_UxVA autocompleteRow-31UJBI autocompleteAliasesRow"><div class="selector-nbyEfM"><div class="contentTitle-sL6DrN small-3-03j1 size12-1IGJl9 height16-1qXrGy weightSemiBold-T8sxWH">Aliases: <strong class="lastword">${BDfunctionsDevilBro.encodeToHTML(lastword)}</strong></div></div></div>`)
						.off("mouseenter." + this.name).on("mouseenter." + this.name, ".selectable-3iSmAf", (e) => {
							autocompletemenu.querySelectorAll(".selectorSelected-2M0IGv").forEach(selected => {selected.classList.remove("selectorSelected-2M0IGv");});
							e.currentTarget.classList.add("selectorSelected-2M0IGv");
						});
						
					for (let alias in matchedaliases) {
						if (amount-- < 1) break;
						$(`<div class="autocompleteRowVertical-3_UxVA autocompleteRow-31UJBI autocompleteAliasesRow"><div class="selector-nbyEfM selectable-3iSmAf"><div class="flex-lFgbSz flex-3B1Tl4 horizontal-2BEEBe horizontal-2VE-Fw flex-3B1Tl4 directionRow-yNbSvJ justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO content-249Pr9" style="flex: 1 1 auto;"><div class="flexChild-1KGW5q aliasword" style="flex: 1 1 auto;">${BDfunctionsDevilBro.encodeToHTML(alias)}</div><div class="description-YnaVYa flexChild-1KGW5q">${BDfunctionsDevilBro.encodeToHTML(matchedaliases[alias].replace)}</div></div></div></div>`)
							.appendTo(autocompletemenu)
							.off("click." + this.name).on("click." + this.name, ".selectable-3iSmAf", (e) => {
								this.swapWordWithAlias(textarea);
							});
					}
					if (!autocompletemenu.querySelector(".selectorSelected-2M0IGv")) {
						autocompletemenu.querySelector(".autocompleteAliasesRow .selectable-3iSmAf").classList.add("selectorSelected-2M0IGv")
					}
				}
			}
		}

		swapWordWithAlias (textarea) {
			let aliasword = textarea.parentElement.querySelector(".autocompleteAliasesRow .selectorSelected-2M0IGv .aliasword").innerText;
			let lastword = textarea.parentElement.querySelector(".autocompleteAliasesRow .lastword").innerText;
			if (aliasword && lastword) {
				$(".autocompleteAliases, .autocompleteAliasesRow").remove();
				textarea.focus();
				textarea.selectionStart = textarea.value.length - lastword.length;
				textarea.selectionEnd = textarea.value.length;
				document.execCommand("insertText", false, aliasword);
				textarea.selectionStart = textarea.value.length;
				textarea.selectionEnd = textarea.value.length;
			}
		}

		formatText (text) {
			var newText = [], files = [], wordAliases = {}, multiAliases = {}, aliases = BDfunctionsDevilBro.loadAllData(this, "words");
			for (let alias in aliases) {
				if (!aliases[alias].regex && alias.indexOf(" ") == -1) wordAliases[alias] = aliases[alias];
				else multiAliases[alias] = aliases[alias];
			}
			for (let word of text.trim().split(" ")) {
				newText.push(this.useAliases(word, wordAliases, files, true));
			}
			newText = newText.length == 1 ? newText[0] : newText.join(" ");
			newText = this.useAliases(newText, multiAliases, files, false);
			return {text:newText, files};
		}

		useAliases (string, aliases, files, singleword) {
			for (let alias in aliases) {
				let aliasdata = aliases[alias];
				let escpAlias = aliasdata.regex ? alias : BDfunctionsDevilBro.regEscape(alias);
				let result = true, replaced = false, tempstring1 = string, tempstring2 = "";
				let regstring = aliasdata.exact ? "^" + escpAlias + "$" : escpAlias;
				while (result != null) {
					result = new RegExp(regstring, (aliasdata.case ? "" : "i") + (aliasdata.exact ? "" : "g")).exec(tempstring1);
					if (result) {
						replaced = true;
						let replace = aliasdata.file ? "" : BDfunctionsDevilBro.insertNRST(aliasdata.replace);
						if (result.length > 1) for (var i = 1; i < result.length; i++) replace = replace.replace(new RegExp("\\\\" + i, "g"), result[i]);
						tempstring2 += tempstring1.slice(0, result.index + result[0].length).replace(result[0], replace);
						tempstring1 = tempstring1.slice(result.index + result[0].length);
						if (aliasdata.file && typeof aliasdata.filedata == "string") {
							var filedata = JSON.parse(aliasdata.filedata);
							files.push(new File([Buffer.from(filedata.data, "base64")], filedata.name, {type:filedata.type}));
						}
						if (aliasdata.regex && regstring.indexOf("^") == 0) result = null;
					}
					if (!result) {
						tempstring2 += tempstring1;
					}
				}
				if (replaced) {
					string = tempstring2;
					if (singleword) break;
				}
			}
			return string;
		}

		replaceWord (string, regex) {
			let result = regex.exec(string), rest = "";
			if (result) {
				rest = string.slice(a.indexOf(b)+b.length);
			}
		}

		getSettingsPanel () {
			var settings = BDfunctionsDevilBro.getAllData(this, "settings"); 
			var words = BDfunctionsDevilBro.loadAllData(this, "words");
			var settingshtml = `<div class="DevilBro-settings">`;
			for (let key in settings) {
				settingshtml += `<div class="flex-lFgbSz flex-3B1Tl4 horizontal-2BEEBe horizontal-2VE-Fw directionRow-yNbSvJ justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO marginBottom8-1mABJ4" style="flex: 1 1 auto;"><h3 class="titleDefault-1CWM9y title-3i-5G_ marginReset-3hwONl weightMedium-13x9Y8 size16-3IvaX_ height24-2pMcnc flexChild-1KGW5q" style="flex: 1 1 auto;">${this.defaults.settings[key].description}</h3><div class="flexChild-1KGW5q switchEnabled-3CPlLV switch-3lyafC value-kmHGfs sizeDefault-rZbSBU size-yI1KRe themeDefault-3M0dJU" style="flex: 0 0 auto;"><input type="checkbox" value="${key}" class="checkboxEnabled-4QfryV checkbox-1KYsPm"${settings[key] ? " checked" : ""}></div></div>`;
			}
			settingshtml += `<div class="flex-lFgbSz flex-3B1Tl4 horizontal-2BEEBe horizontal-2VE-Fw directionRow-yNbSvJ justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO marginBottom8-1mABJ4" style="flex: 0 0 auto;"><h3 class="titleDefault-1CWM9y title-3i-5G_ marginReset-3hwONl weightMedium-13x9Y8 size16-3IvaX_ height24-2pMcnc flexChild-1KGW5q" style="flex: 0 0 auto;">Replace:</h3><input action="add" type="text" placeholder="Wordvalue" class="inputDefault-Y_U37D input-2YozMi size16-3IvaX_ wordInputs" id="input-wordvalue" style="flex: 1 1 auto;"><button action="add" type="button" class="flexChild-1KGW5q button-2t3of8 lookFilled-luDKDo colorBrand-3PmwCE sizeMedium-2VGNaF grow-25YQ8u btn-add btn-addword" style="flex: 0 0 auto;"><div class="contents-4L4hQM"></div></button></div><div class="flex-lFgbSz flex-3B1Tl4 horizontal-2BEEBe horizontal-2VE-Fw directionRow-yNbSvJ justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO marginBottom8-1mABJ4" style="flex: 0 0 auto;"><h3 class="titleDefault-1CWM9y title-3i-5G_ marginReset-3hwONl weightMedium-13x9Y8 size16-3IvaX_ height24-2pMcnc flexChild-1KGW5q" style="flex: 0 0 auto;">With:</h3><input action="add" type="text" placeholder="Replacevalue" class="inputDefault-Y_U37D input-2YozMi size16-3IvaX_ wordInputs" id="input-replacevalue" style="flex: 1 1 auto;"><button type="button" class="flexChild-1KGW5q button-2t3of8 lookFilled-luDKDo colorBrand-3PmwCE sizeMedium-2VGNaF grow-25YQ8u file-navigator" style="flex: 0 0 auto;"><div class="contents-4L4hQM"></div><input id="input-file" type="file" style="display:none!important;"></button></div>`;
			settingshtml += `<div class="flex-lFgbSz flex-3B1Tl4 horizontal-2BEEBe horizontal-2VE-Fw directionRow-yNbSvJ justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO marginBottom8-1mABJ4" style="flex: 0 0 auto;"><h3 class="titleDefault-1CWM9y title-3i-5G_ marginReset-3hwONl weightMedium-13x9Y8 size16-3IvaX_ height24-2pMcnc flexChild-1KGW5q" style="flex: 0 0 auto; width: ${525 - (this.configtypes.length * 33)}px;">List of Chataliases:</h3><div class="flex-3B1Tl4 horizontal-2BEEBe horizontal-2VE-Fw flex-3B1Tl4 directionRow-yNbSvJ justifyCenter-29N31w alignCenter-3VxkQP noWrap-v6g9vO" style="flex: 1 1 auto; max-width: ${this.configtypes.length * 34}px;">`;
			for (let config of this.configtypes) {
				settingshtml += `<div class="marginTop8-2gOa2N headerSize-22dv1R size10-1ZEdeK primary-2giqSn weightBold-2qbcng" style="flex: 1 1 auto; width: 34px; text-align: center;">${config.toUpperCase()}</div>`;
			}
			settingshtml += `</div></div><div class="DevilBro-settings-inner alias-list user-settings-games marginBottom8-1mABJ4">`;
			for (let word in words) {
				settingshtml += `<div class="flex-lFgbSz flex-3B1Tl4 vertical-3X17r5 flex-3B1Tl4 directionColumn-2h-LPR justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO marginTop4-2rEBfJ marginBottom4-_yArcI card-11ynQk"><div class="card-11ynQk-inner"><input type="text" word="${word}" action="edit" class="game-name game-name-input word-name" value="${BDfunctionsDevilBro.encodeToHTML(word)}"><input type="text" word="${word}" action="edit" class="game-name game-name-input replace-name" value="${BDfunctionsDevilBro.encodeToHTML(words[word].replace)}">`;
				for (let config of this.configtypes) {
					settingshtml += `<div class="checkboxContainer-1sZ9eo marginReset-2tTc4H" style="flex: 0 0 auto;"><label class="checkboxWrapper-2Yvr_Y"><input word="${word}" config="${config}" type="checkbox" class="inputDefault-2tiBIA input-oWyROL"${words[word][config] ? " checked" : ""}><div class="checkbox-1QwaS4 center-1MLNrE flex-3B1Tl4 justifyStart-2yIZo0 alignCenter-3VxkQP round-30vw42"><svg name="Checkmark" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><polyline stroke="transparent" stroke-width="2" points="3.5 9.5 7 13 15 5"></polyline></g></svg></div></label></div>`;
				}
				settingshtml += `</div><div word="${word}" action="remove" class="button-1qrA-N remove-word"></div></div>`;
			}
			settingshtml += `</div>`;
			settingshtml += `<div class="flex-lFgbSz flex-3B1Tl4 horizontal-2BEEBe horizontal-2VE-Fw directionRow-yNbSvJ justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO marginBottom20-2Ifj-2" style="flex: 0 0 auto;"><h3 class="titleDefault-1CWM9y title-3i-5G_ marginReset-3hwONl weightMedium-13x9Y8 size16-3IvaX_ height24-2pMcnc flexChild-1KGW5q" style="flex: 1 1 auto;">Remove all added words.</h3><button action="removeall" type="button" class="flexChild-1KGW5q button-2t3of8 lookFilled-luDKDo colorRed-3HTNPV sizeMedium-2VGNaF grow-25YQ8u remove-all" style="flex: 0 0 auto;"><div class="contents-4L4hQM">Reset</div></button></div>`;
			var infoHidden = BDfunctionsDevilBro.loadData("hideInfo", this, "hideInfo");
			settingshtml += `<div class="flex-lFgbSz flex-3B1Tl4 horizontal-2BEEBe horizontal-2VE-Fw directionRow-yNbSvJ justifyStart-2yIZo0 alignCenter-3VxkQP noWrap-v6g9vO cursorPointer-3oKATS ${infoHidden ? "wrapperCollapsed-18mf-c" : "wrapperDefault-1Dl4SS"} toggle-info" style="flex: 1 1 auto;"><svg class="iconTransition-VhWJ85 ${infoHidden ? "closed-2Hef-I iconCollapsed-1INdMX" : "iconDefault-xzclSQ"}" width="12" height="12" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 10L12 15 17 10"></path></svg><div class="colorTransition-2iZaYd overflowEllipsis-2ynGQq nameCollapsed-3_ChMu" style="flex: 1 1 auto;">Information</div></div>`;
			settingshtml += `<div class="DevilBro-settings-inner info-container" ${infoHidden ? "style='display:none;'" : ""}><div class="description-3MVziF formText-1L-zZB note-UEZmbY modeDefault-389VjU primary-2giqSn">Case: Will replace words while comparing lowercase/uppercase. apple => apple, not APPLE or AppLe</div><div class="description-3MVziF formText-1L-zZB note-UEZmbY modeDefault-389VjU primary-2giqSn">Not Case: Will replace words while ignoring lowercase/uppercase. apple => apple, APPLE and AppLe</div><div class="description-3MVziF formText-1L-zZB note-UEZmbY modeDefault-389VjU primary-2giqSn">Exact: Will replace words that are exactly the replaceword. apple to pear => applepie stays applepie</div><div class="description-3MVziF formText-1L-zZB note-UEZmbY modeDefault-389VjU primary-2giqSn">Not Exact: Will replace words anywhere they appear. apple to pear => applepieapple to pearpiepear</div><div class="description-3MVziF formText-1L-zZB note-UEZmbY modeDefault-389VjU primary-2giqSn">Autoc: Will appear in the Autocomplete Menu (if enabled).</div><div class="description-3MVziF formText-1L-zZB note-UEZmbY modeDefault-389VjU primary-2giqSn">Regex: Will treat the entered wordvalue as a regular expression. <a target="_blank" href="https://regexr.com/">Help</a></div><div class="description-3MVziF formText-1L-zZB note-UEZmbY modeDefault-389VjU primary-2giqSn">File: If the replacevalue is a filepath it will try to upload the file located at the filepath.</div>`;
			settingshtml += `</div>`;

			var settingspanel = $(settingshtml)[0];

			BDfunctionsDevilBro.initElements(settingspanel);

			$(settingspanel)
				.on("click", ".checkbox-1KYsPm", () => {this.updateSettings(settingspanel);})
				.on("keypress", ".wordInputs", (e) => {if (e.which == 13) this.updateContainer(settingspanel, e.currentTarget);})
				.on("keyup", ".game-name-input", (e) => {this.updateWord(e.currentTarget);})
				.on("click", ".btn-addword, .remove-word, .remove-all", (e) => {this.updateContainer(settingspanel, e.currentTarget);})
				.on("click", ".input-oWyROL", (e) => {this.updateConfig(e.currentTarget);})
				.on("click", ".toggle-info", (e) => {this.toggleInfo(settingspanel, e.currentTarget);});
			return settingspanel;
		}
	}
};
