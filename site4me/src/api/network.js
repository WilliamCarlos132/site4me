import axios from 'axios'

const http = axios.create({
    baseURL: '',
    timeout: 10000
})

export default {
    // 查询全部网络记录（ourNote v1: GET /nets）
    list() { return http.get('/nets') },
    // 新增
    create(data) { return http.post('/nets', data) },
    // 更新
    update(id, data) { return http.put(`/nets/${id}`, data) },
    // 删除
    delete(id) { return http.delete(`/nets/${id}`) }
}