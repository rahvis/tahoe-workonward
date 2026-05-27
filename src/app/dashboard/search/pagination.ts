export type PaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

export function buildPaginationTokens(
    currentPage: number,
    totalPages: number,
    maxNumericButtons: number = 10,
): PaginationToken[] {
    if (totalPages <= 0) return [];
    if (totalPages <= maxNumericButtons) {
        return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    const firstPage = 1;
    const lastPage = totalPages;
    const middleWindow = Math.max(3, maxNumericButtons - 2);
    let start = Math.max(2, currentPage - Math.floor(middleWindow / 2));
    let end = start + middleWindow - 1;

    if (end >= lastPage) {
        end = lastPage - 1;
        start = Math.max(2, end - middleWindow + 1);
    }

    const tokens: PaginationToken[] = [firstPage];
    if (start > 2) tokens.push('ellipsis-left');
    for (let pageNum = start; pageNum <= end; pageNum += 1) {
        tokens.push(pageNum);
    }
    if (end < lastPage - 1) tokens.push('ellipsis-right');
    tokens.push(lastPage);
    return tokens;
}
