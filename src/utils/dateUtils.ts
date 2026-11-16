import dayjs from "dayjs";

export const formatDate = (value: string | null) =>
    value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '—';
