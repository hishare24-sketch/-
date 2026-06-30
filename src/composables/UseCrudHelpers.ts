import { computed, reactive, ref, type Ref } from 'vue'

export type FormAction = 'create' | 'edit'

interface CrudOptions<T> {
  // مصدر العناصر (مثلاً عناصر المشروع النشط) — تفاعلي
  source: Ref<T[]> | (() => T[])
  // الحقول التي يشملها البحث النصّي
  searchFields?: (keyof T)[]
  itemsPerPage?: number
}

// مساعد عام لصفحات CRUD (نسخة offline تعمل على مصفوفات Pinia) — مكافئ UseCrudHelpers في الدليل
export function UseCrudHelpers<T extends { id: string | number }>(opts: CrudOptions<T>) {
  const params = reactive({
    page: 1,
    itemPerPage: opts.itemsPerPage ?? 10,
    keyword: '',
  })

  const allItems = computed<T[]>(() =>
    typeof opts.source === 'function' ? opts.source() : opts.source.value,
  )

  const filtered = computed<T[]>(() => {
    const kw = params.keyword.trim().toLowerCase()
    if (!kw || !opts.searchFields?.length) return allItems.value
    return allItems.value.filter((item) =>
      opts.searchFields!.some((f) => String(item[f] ?? '').toLowerCase().includes(kw)),
    )
  })

  const metaData = computed(() => {
    const total = filtered.value.length
    const lastPage = Math.max(1, Math.ceil(total / params.itemPerPage))
    return { total, lastPage, currentPage: Math.min(params.page, lastPage) }
  })

  const tableData = computed<T[]>(() => {
    const start = (metaData.value.currentPage - 1) * params.itemPerPage
    return filtered.value.slice(start, start + params.itemPerPage)
  })

  // حالة المودالات
  const showFormModal = ref(false)
  const showDetailsModal = ref(false)
  const formAction = ref<FormAction>('create')
  const activeItem = ref<T | null>(null) as Ref<T | null>

  function showCreateModal() {
    activeItem.value = null
    formAction.value = 'create'
    showFormModal.value = true
  }
  function showEditModal(item: T) {
    activeItem.value = item
    formAction.value = 'edit'
    showFormModal.value = true
  }
  function showViewModal(item: T) {
    activeItem.value = item
    showDetailsModal.value = true
  }

  function onChangeSearch(keyword: string) {
    params.keyword = keyword
    params.page = 1
  }
  function onChangePage(page: number) {
    params.page = page
  }

  return {
    params,
    tableData,
    metaData,
    filtered,
    showFormModal,
    showDetailsModal,
    formAction,
    activeItem,
    showCreateModal,
    showEditModal,
    showViewModal,
    onChangeSearch,
    onChangePage,
  }
}

export default UseCrudHelpers
