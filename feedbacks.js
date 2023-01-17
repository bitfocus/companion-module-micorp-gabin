const { combineRgb } = require('@companion-module/base')
const { listToChoice, objectsToChoice } = require('./utils')

module.exports = function (self) {
	self.setFeedbackDefinitions({
		autocam: {
			type: 'boolean',
			name: 'Autocam',
			description: 'If autocam is active, change the style of the button',
			options: [],
			defaultStyle: {
				color: combineRgb(0,0,0),
				bgcolor: combineRgb(255,255,255),
			},
			callback: () => {
				return self.states.autocam
			}
		},
		currentShot: {
			type: 'boolean',
			name: 'Shot triggered',
			description: 'If shot is active, change the style of the button',
			defaultStyle: {
				color: combineRgb(0,0,0),
				bgcolor: combineRgb(255,255,255),
			},
			options: [{
				type: 'dropdown',
				label: 'Shot',
				id: 'shot',
				choices: objectsToChoice(self.shotlist),
				minChoicesForSearch: 5,
			}],
			callback: (feedback) => {
				if (feedback.options.shot === self.states.currentShot.id){
					return true
				}
				return false
			}
		},
		availableMic: {
			type: 'boolean',
			name: 'Mic is available',
			description: 'If mic is available, change the style of the button',
			defaultStyle: {
				color: combineRgb(0,0,0),
				bgcolor: combineRgb(255,255,255),
			},
			options: [{
				type: 'dropdown',
				label: 'Mic',
				id: 'mic',
				choices: listToChoice(self.miclist),
				minChoicesForSearch: 5,
			}],
			callback: (feedback) => {
				if (self.states.availableMics.indexOf(feedback.options.mic) !== -1){
					return true
				}
				return false
			}
		}
	})
}
