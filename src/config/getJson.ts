const inFlightGets = new Map<string, Promise<unknown>>();

export const getJson = <T,>(url: string, headers: HeadersInit = { accept: '*/*' }): Promise<T> => {
    const existingRequest = inFlightGets.get(url);
    if (existingRequest) return existingRequest as Promise<T>;

    const request = fetch(url, { headers }).then(async (response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json() as Promise<T>;
    });
    inFlightGets.set(url, request);
    request.finally(() => {
        if (inFlightGets.get(url) === request) inFlightGets.delete(url);
    }).catch(() => undefined);
    return request;
};
