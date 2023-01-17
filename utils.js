
const HEADER = '__gabin0istryingtocommunicate__'
const TYPES = {
    autoCam: 'autocam',
    triggerShot: 'triggershot',
    availableMic: 'availablemic'
}

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

module.exports = {
    HEADER,
    TYPES,
    parseData,
    listToChoice,
    objectsToChoice,
}
