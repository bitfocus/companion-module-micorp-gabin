const tcp = require('../../tcp')
const instance_skel = require('../../instance_skel')

const TYPES = {
    autoCam: 'autocam',
    triggerShot: 'triggershot',
    availableMic: 'availablemic'
}

const HEADER = '__gabin0istryingtocommunicate__'

const parseData = (data) => {
    let requests = []

    const stringData = data.toString()
    const stringRequests = stringData.split(HEADER)
    for (const stringReq of stringRequests){
        if (stringReq){
            requests.push(JSON.parse(stringReq))
        }
    }

    return requests
}

const listToChoice = (list) => {
    return list.map((v)=>({id:v, label:v}))
}

const objectsToChoice = (list) => {
    return list.map((v)=>({id:v.id, label:v.name}))
}


class instance extends instance_skel {

    constructor(system, id, config) {
        super(system, id, config)

        this.shotlist = []
        this.miclist = []
        this.states = {
            autocam:        false,
            availableMics:  [],
            currentShot:    ''
        }

        this.initActions()
        this.initFeedacks()
    }

    initActions() {
        this.setActions({
            autoCam: {
                label: 'Set autocam',
                options: [
                    {
                        type: 'dropdown',
                        label: 'Autocam',
                        id: 'autocam',
                        default: 'toggle',
                        choices: [
                            { id: 'toggle', label: 'Toggle' },
                            { id: 'true', label: 'On' },
                            { id: 'false', label: 'Off' }
                        ]
                    }
                ]
            },
            triggerShot: {
                label: 'Trigger Shot',
                options: [
                    {
                        type: 'dropdown',
                        label: 'Shot',
                        id: 'shot',
                        choices: objectsToChoice(this.shotlist)
                    }
                ]
            },
            availableMic: {
                label: 'Available Mic',
                options: [
                    {
                        type: 'dropdown',
                        label: 'Microphone',
                        id: 'mic',
                        choices: listToChoice(this.miclist)
                    }
                ]
            },
    
        })
    }

    initFeedacks() {
        const self = this
        this.setFeedbackDefinitions({
            autocam: {
                type: 'boolean',
                label: 'Autocam',
                description: 'If autocam is active, change the style of the button',
                style: {
                    color: this.rgb(0,0,0),
                    bgcolor: this.rgb(255,255,255),
                },
                callback: (_feedback) => {
                    return this.states.autocam
                }
            },
            currentShot: {
                type: 'boolean',
                label: 'Shot triggered',
                description: 'If shot is active, change the style of the button',
                style: {
                    color: this.rgb(0,0,0),
                    bgcolor: this.rgb(255,255,255),
                },
                options: [
                    {
                        type: 'dropdown',
                        label: 'Shot',
                        id: 'shot',
                        choices: objectsToChoice(self.shotlist),
                        minChoicesForSearch: 5,
                    },
                ],
                callback: (feedback) => {
                    if (feedback.options.shot === this.states.currentShot){
                        return true
                    }
                    return false
                }
            },
            availableMic: {
                type: 'boolean',
                label: 'Mic is available',
                description: 'If mic is available, change the style of the button',
                style: {
                    color: this.rgb(0,0,0),
                    bgcolor: this.rgb(255,255,255),
                },
                options: [
                    {
                        type: 'dropdown',
                        label: 'Mic',
                        id: 'mic',
                        choices: listToChoice(self.miclist),
                        minChoicesForSearch: 5,
                    },
                ],
                callback: (feedback) => {
                    if (this.states.availableMics.indexOf(feedback.options.mic) !== -1){
                        return true
                    }
                    return false
                }
            },
        })
    }

    // Return config fields for web config
    config_fields() {
        return [
            {
                type: 'text',
                id: 'info',
                width: 12,
                label: 'Information',
                value:
                    'This module is for Gabin, download <a href="" target="_new">here (not functionnal)</a>.'
            },
            {
                type: 'textinput',
                id: 'host',
                label: 'Target IP',
                width: 6,
                regex: this.REGEX_IP,
                default: '127.0.0.1'
            },
            {
                type: 'textinput',
                id: 'port',
                label: 'Port number',
                width: 6,
                regex: this.REGEX_PORT,
                default: 6481
            },
        ]
    }

    updateConfig(config) {
        let resetConnection = false

        if (this.config.host != config.host) {
            resetConnection = true
        }

        this.config = config

        if (resetConnection === true || this.socket === undefined) {
            this.initTCP()
        }
    }

    init() {
        this.initTCP()
    }

    // When module gets deleted
    destroy() {
        if (this.socket !== undefined) {
            this.socket.destroy()
        }
        
        this.debug('destroy', this.id)
    }

    // // Functions to handle socket events
    // // makeConnection() {
    // //     console.log(`Connecting to ${this.config.host}:${this.config.port}...`)
    // //     // Create socket and bind callbacks
    // //     this.tcp = new tcp(this.config.host, this.config.port)

    // //     this.tcp.on('status_change', (status, message) => {
    // //         this.status(status, message)
    // //     })
    // //     this.tcp.on('connect', () => {
    // //         this.log('info', 'connected')
    // //         console.log('connected')
    // //         this.status(this.STATUS_OK)
    // //         clearInterval(this.intervalConnect)
    // //         this.retrying = false
    // //     })
    // //     this.tcp.on('data', (data) => {
    // //         let dataArray = data.toString().trim().split('\r\n')
    // //         for (const iterator of dataArray) {
    // //             const json = ((raw) => {
    // //                 try {
    // //                     return JSON.parse(raw)
    // //                 } catch (objError) {
    // //                     if (objError instanceof SyntaxError) {
    // //                         console.error(objError.name)
    // //                     } else {
    // //                         console.error(objError.message)
    // //                     }
    // //                 }
    // //             })(iterator)
    // //             this.processData(json)
    // //         }
    // //     })

    // //     this.tcp.on('close', () => {
    // //         this.log('info', 'Connection closed')
    // //         if (!this.retrying) {
    // //             this.retrying = true
    // //             console.log('Reconnecting...')
    // //         }
    // //         this.intervalConnect = setInterval(this.makeConnection(), this.timeout)
    // //     })
    // // }
    // endEventHandler() {
    //     console.log('end')
    // }
    // timeoutEventHandler() {
    //     console.log('timeout')
    // }
    // drainEventHandler() {
    //     console.log('drain')
    // }
    // errorEventHandler() {
    //     console.log('error')
    // }

    action(action) {
        let type = TYPES[action.action]
        let data

        if (!type){
            return
        }

        switch (action.action) {
            case 'autoCam':
                let autocam
                if (action.options.autocam !== 'toggle') {
                    autocam = action.options.autocam === 'true' ? true : false
                } else if (action.options.autocam === 'toggle') {
                    autocam = !this.states.autocam
                }
                data = { autocam }
                break
            case 'triggerShot':
                const shot = this.shotlist.find((shot) => shot.id === action.options.shot)
                if (shot) data = { shot }
                break
            case 'availableMic':
                data = { mic:action.options.mic }
                break
        }

        if (data){
            this.sendCommand({ type:'streamdeck.'+type, data })
        }
    }

    sendCommand(cmd) {
        if (cmd !== undefined && cmd != '') {
            if (this.socket !== undefined && this.socket.connected) {
                this.socket.send(JSON.stringify(cmd))
            }
        }
    }

    handleRequest(request) {
        // console.log(request)

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
        this.initActions()
        this.initFeedacks()
    }
    
    handleMicList(data) {
        this.miclist = data.miclist
        this.initActions()
        this.initFeedacks()
    }

    handleAvailableMics(data) {
        this.states.availableMics = data.availableMics
        this.checkFeedbacks('availableMic')
    }
    
    handleCurrentShot(data) {
        this.states.currentShot = data.currentShot
        this.checkFeedbacks('currentShot')
    }

    initTCP() {
        if (this.socket !== undefined) {
            this.socket.destroy()
            delete this.socket
        }

        if (this.config.port === undefined) {
            this.config.port = 6481
        }
        if (this.config.host === undefined) {
            this.config.host = '127.0.0.1'
        }

        this.socket = new tcp(this.config.host, this.config.port)

        this.socket.on('status_change', (status, message) => {
            this.status(status, message)
        })

        this.socket.on('data', (data) => {
            let requests = parseData(data)
            for (const req of requests){
                this.handleRequest(req)
            }
        })

        this.socket.on('error', (err) => {
            this.debug('Network error', err)
            this.log('error', 'Network error: ' + err.message)
        })

        this.socket.on('connect', () => {
            this.debug('Connected')
        })
    }
}
exports = module.exports = instance