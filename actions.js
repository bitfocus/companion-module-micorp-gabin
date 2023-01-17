const { listToChoice, objectsToChoice, TYPES } = require('./utils')

module.exports = function (self) {
	self.setActionDefinitions({
		autoCam: {
			name: 'Set autocam',
			options: [{
				id: 'autocam',
				type: 'dropdown',
				label: 'Autocam',
				default: 'toggle',
				choices: [
					{ id: 'toggle', label: 'Toggle' },
					{ id: 'true', label: 'On' },
					{ id: 'false', label: 'Off' }
				]
			}],
			callback: (action) => {
				let type = TYPES[action.actionId]
				if (!type) return

				let autocam
                if (action.options.autocam !== 'toggle') {
					autocam = action.options.autocam === 'true' ? true : false
                } else {
					autocam = !self.states.autocam
                }

				self.sendData({ autocam }, type)
			}
		},
		triggerShot: {
			name: 'Trigger Shot',
			options: [{
				id: 'shot',
				type: 'dropdown',
				label: 'Shot',
				choices: objectsToChoice(self.shotlist)
			}],
			callback: (action) => {
				let type = TYPES[action.actionId]
				if (!type) return

				const shot = self.shotlist.find((shot) => shot.id === action.options.shot)
				if (!shot) return

				self.sendData({ shot }, type)
			}
		},
		availableMic: {
			name: 'Available Mic',
			options: [{
				id: 'mic',
				type: 'dropdown',
				label: 'Microphone',
				choices: listToChoice(self.miclist)
			}],
			callback: (action) => {
				let type = TYPES[action.actionId]
				if (!type) return

				self.sendData({ mic:action.options.mic }, type)
			}
		},
	})
}
