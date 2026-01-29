export class RequestError extends Error {
    public response: Response;

    constructor(response: Response, message?: string) {
        super(message || `Request failed with status ${response.status}`);
        this.name = "RequestError";
        this.response = response;
    }
}
