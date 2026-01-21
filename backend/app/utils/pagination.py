def get_pagination(page: int = 1, page_size: int = 10):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    skip = (page - 1) * page_size
    return skip, page_size
