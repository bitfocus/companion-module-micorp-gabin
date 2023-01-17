const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const { parseData } = require('./utils')


class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.socket

		this.shotlist = []
		this.miclist = []
		this.states = {
            autocam:        false,
            availableMics:  [],
            currentShot:    ''
        }
	}

	async init(config) {
		this.config = config

		this.updateActions()
		this.updateFeedbacks()

		await this.configUpdated(config)
	}

	// When module gets deleted
	async destroy() {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.updateStatus(InstanceStatus.Disconnected)

		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.config = config

		this.initTcp()
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			// {
			// 	type: 'text',
			// 	id: 'info',
			// 	label: 'Information',
			// 	width: 12,
			// 	value: 'This is a test module for Companion.'
			// },
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 8,
				regex: Regex.IP,
				default: '127.0.0.1'
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				regex: Regex.PORT,
				default: 6481
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
    }

    sendData(data, type) {
	    const cmd = { type:'streamdeck.'+type, data }

        if (cmd != '' && this.socket && this.socket.isConnected) {
			this.socket.send(JSON.stringify(cmd))
		}
	}

	handleRequest(request) {
        if (!request.type){
            return
        }

        switch (request.type) {
            case 'gabin0.autocam':
                this.handleAutoCam(request.data)
                break
            case 'gabin0.shotlist':
                this.handleShotList(request.data)
                break
            case 'gabin0.miclist':
                this.handleMicList(request.data)
                break
            case 'gabin0.availablemics':
                this.handleAvailableMics(request.data)
                break
            case 'gabin0.currentshot':
                this.handleCurrentShot(request.data)
                break
        }
    }

	handleAutoCam(data) {
        this.states.autocam = data.autocam
        this.checkFeedbacks('autocam')
    }
    
    handleShotList(data) {
        this.shotlist = data.shotlist
        this.updateActions()
		this.updateFeedbacks()
    }
    
    handleMicList(data) {
        this.miclist = data.miclist
        this.updateActions()
        this.updateFeedbacks()
    }

    handleAvailableMics(data) {
        this.states.availableMics = data.availableMics
        this.checkFeedbacks('availableMic')
    }
    
    handleCurrentShot(data) {
        this.states.currentShot = data.currentShot
        this.checkFeedbacks('currentShot')
    }

	initTcp() {
		if (this.socket) {
            this.socket.destroy()
            delete this.socket
        }

		this.updateStatus(InstanceStatus.Connecting)
		
		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig)
			return
		}

		this.socket = new TCPHelper(this.config.host, this.config.port)

		this.socket.on('status_change', (status, message) => {
			this.updateStatus(status, message)
		})

		this.socket.on('error', (err) => {
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
			this.log('error', 'Network error: ' + err.message)
		})

		this.socket.on('data', (data) => {
			const requests = parseData(data)
			for (const req of requests){
                this.handleRequest(req)
            }
		})
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)