import axios from 'axios'

const http = axios.create({
    baseURL: '/api',  // 后端接口前缀
    timeout: 10000
})

export default {
    create(data) { return http.post('/polls', data) },
    list() { return http.get('/polls') },
    vote(pollId, optionId) { return http.post(`/polls/${pollId}/vote`, { optionId }) }
}