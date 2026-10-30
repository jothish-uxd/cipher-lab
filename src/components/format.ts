const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = (iso: string) => fmt.format(new Date(iso + 'T00:00:00'));
