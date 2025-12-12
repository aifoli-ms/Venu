
const getApiBaseUrl = () => {

    const path = window.location.pathname;
    const srcIndex = path.indexOf('/src/');

    if (srcIndex !== -1) {

        const root = window.location.origin + path.substring(0, srcIndex);
        return root + '/index.php';
    }


    return window.location.origin + '/index.php';
};

const API_BASE_URL = getApiBaseUrl();


if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL };
}
