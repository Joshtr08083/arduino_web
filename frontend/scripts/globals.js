// Global values shared with main and graph
export const global = {
    data: null,
    connectionState: {
        server: true,
        esp32: true
    },
    WS_URL: `${window.location.origin}/ws/`,
    API_URL: `${window.location.origin}`
}