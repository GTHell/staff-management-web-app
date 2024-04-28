<script setup>
import moment from 'moment';
import JsonExcel from 'vue-json-excel3';
import { jsPDF } from 'jspdf'
import autoTable  from 'jspdf-autotable'
import { onMounted, ref, toRaw } from 'vue';
import { initFlowbite } from 'flowbite';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';


// Init state
const loading = ref(false)
const error = ref(null)
const staffsData = ref([])
const newStaff = ref({
	staffId: '',
	fullname: '',
	gender: 1,
	birthdate: new Date(2000, 1, 1)
})
const selectedRow = ref(null)

const showEditModal = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)

const staffIdQuery = ref("")
const genderQuery = ref(0)
const birthdateRangeQuery = ref(["", ""])

const selectedStaff = ref({
	id: 1,
	staffId: '',
	fullname: '',
	gender: 1,
	birthdate: new Date(2000, 1, 1)
})


// initialize components based on data attribute selectors
onMounted(async () => {
	await fetchStaffsData();

	initFlowbite()

	// initialize start end
	// const startDate = new Date()
	// const endDate = new Date(new Date().setDate(startDate.getDate() + 7));
	// birthdateRangeQuery.value = [startDate, endDate]
})

// Handle the date range cleared to prevent null value
function handleDateRangeClear() {
	birthdateRangeQuery.value = ["", ""]
}

// process excel data
function exportToExcel() {
	// Deep copy to the ref value
	let data = JSON.parse(JSON.stringify(toRaw(staffsData.value)))

	data.forEach(staff => {
		staff.birthdate = moment(staff.birthdate).format("YYYY/MM/DD")
		staff.gender = staff.gender == 1 ? "Male" : "Female"
	} )

	return data
}

// export to pdf
function exportToPdf() {
	// Deep copy to the ref value
	let data = JSON.parse(JSON.stringify(toRaw(staffsData.value)))

	data.forEach(staff => {
		staff.birthdate = moment(staff.birthdate).format("YYYY/MM/DD")
		staff.gender = staff.gender == 1 ? "Male" : "Female"
	} )

	data = data.map(obj => Object.values(obj))

	const doc = new jsPDF();
	autoTable(doc, {
		head: [['ID', 'Staff ID', 'Fullname', 'Gender', 'Birthdate']],
		body: data
	})

	doc.save('data.pdf')
}

// apply filter
function applyFilter() {
	fetchStaffsData()
}

// clear filter
function clearFilter() {
	staffIdQuery.value = ""
	genderQuery.value = 0
	birthdateRangeQuery.value = ["", ""]
	fetchStaffsData()
}

// update selected row
function updateSelectedRow(rowId) {
	const s = staffsData.value[rowId]

	// update selected row to update the list later
	selectedRow.value = rowId

	selectedStaff.value = {
		id: s.id,
		staffId: s.staffId,
		fullname: s.fullname,
		gender: s.gender,
		birthdate: s.birthdate
	}
}

// delete staff
function deleteStaff() {
	const options = {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		},
	}

	fetch(import.meta.env.VITE_API_URL + "/staffs/" + selectedStaff.value.id, options)
		.finally(() => {
			// update the staffsData list
			staffsData.value.splice(selectedRow.value, 1);

			// reset selectedStaff
			selectedStaff.value = {
				id: 1,
				staffId: '',
				fullname: '',
				gender: 1,
				birthdate: new Date(2000, 1, 1)
			}

			// close modal
			showDeleteModal.value = false;
			// const $targetEl = document.querySelector('[data-modal-hide="deleteUserModal"]');
			// $targetEl.click();
		})
		.catch(e => console.log(e))
}

// update existing staff
function updateStaff() {
	const payload = JSON.stringify({
		id: parseInt(selectedStaff.value.id),
		staffId: selectedStaff.value.staffId,
		fullname: selectedStaff.value.fullname,
		gender: parseInt(selectedStaff.value.gender),
		birthdate: moment(selectedStaff.value.birthdate).format("YYYY-MM-DD")
	})
	console.log(payload)

	const options = {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: payload
	}

	fetch(import.meta.env.VITE_API_URL + "/staffs/" + selectedStaff.value.id, options)
		.finally(() => {
			// update the staffsData list
			staffsData.value[selectedRow.value] = {...selectedStaff.value}

			// reset selectedStaff
			selectedStaff.value = {
				id: 1,
				staffId: '',
				fullname: '',
				gender: 1,
				birthdate: new Date(2000, 1, 1)
			}

			// close modal
			showEditModal.value = false
			// const $targetEl = document.querySelector('[data-modal-hide="editUserModal"]');
			// $targetEl.click();
		})
		.catch(e => console.log(e))
}

// create new staff
function createStaff() {

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			staffId: newStaff.value.staffId,
			fullname: newStaff.value.fullname,
			gender: parseInt(newStaff.value.gender),
			birthdate: moment(newStaff.value.birthdate).format("YYYY-MM-DD"),
		})
	}

	fetch(import.meta.env.VITE_API_URL + "/staffs", options)
		.then(res => res.json())
		.then((data) => staffsData.value.push(data))
		.finally(() => {
			// reset state
			newStaff.value = {
				staffId: '',
				fullname: '',
				gender: 1,
				birthdate: new Date(2000, 1, 1)
			}

			// close modal
			showCreateModal.value = false
			// const $targetEl = document.querySelector('[data-modal-hide="createUserModal"]');
			// $targetEl.click();
		})
		.catch(e => console.log(e))
}

// helper function
function isValidValue(value) {
	return value !== null && value !== "" && value !== 0
}

function fetchStaffsData() {
	console.log("Fetching Data")
	loading.value = true

	// Construct the URL parameters
	const urlSearchParams = new URLSearchParams();
	if (isValidValue(staffIdQuery.value)) urlSearchParams.append('staffId', staffIdQuery.value)
	if (isValidValue(genderQuery.value)) urlSearchParams.append('gender', genderQuery.value)
	if (isValidValue(birthdateRangeQuery.value[0])) urlSearchParams.append('from', moment(birthdateRangeQuery.value[0]).format("YYYY-MM-DD"))
	if (isValidValue(birthdateRangeQuery.value[1])) urlSearchParams.append('to', moment(birthdateRangeQuery.value[1]).format("YYYY-MM-DD"))
	const url = `${import.meta.env.VITE_API_URL}/staffs?${urlSearchParams.toString()}`

	fetch(url, {
		method: "GET",
		headers: {
			'Content-Type': 'application/x-form-urlencoded'
		}
	})
		.then(res => res.json())
		.then((data) => {
			console.log(data); staffsData.value = data
		})
		.finally(() => loading.value = false)
	console.log(typeof(staffsData))
}

</script>

<template>
	<div class="container mx-auto h-screen max-h-screen min-h-screen">
		<h1 class="text-blue-500">Staff Management</h1>

		<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
			<div class="px-5 flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 bg-white dark:bg-gray-900">
				<!-- Search -->
				<div class="px-5 space-x-2 flex items-center flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 bg-white dark:bg-gray-900">
					<div>
						<label for="staff-id-query" class="sr-only">Search</label>
						<div class="relative">
							<div class="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
								<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
									<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
								</svg>
							</div>
							<input type="text" v-model="staffIdQuery" id="staff-id-query"
								class="block pt-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-50 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
								placeholder="Search for staff">
						</div>
					</div>

					<div>
						<label for="gender-query" class="sr-only">Underline select</label>
						<select id="gender-query" v-model="genderQuery" class="block py-2.5 px-0 w-full text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer">
							<option value=0 selected>Gender</option>
							<option value=1>Male</option>
							<option value=2>Female</option>
						</select>
					</div>

					<div>
						<VueDatePicker 
						id="birthdate-range-query"
						@keydown.enter.prevent
						text-input
						v-model="birthdateRangeQuery" 
						:enable-time-picker="false"
						@cleared="handleDateRangeClear"
						class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						range multi-calendars />
					</div>
					<button @click="applyFilter" id="filter-button" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">Filter</button>
					<button @click="clearFilter" id="clear-button" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">Clear</button>
				</div>
				<div class="px-5 inline-flex items-center flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 bg-white dark:bg-gray-900">

					<JsonExcel 
					id="export-excel-btn"
					:fetch="exportToExcel"
					worksheet="Staff Data"
					name="data.xls"
					> 
					<button
					class="btn bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded-l-sm" 
					>
						Export to Excel
					</button>
					</JsonExcel>
					<JsonExcel 
					id="export-pdf-btn"
					:fetch="exportToPdf"
					worksheet="Staff Data"
					name="data.xls"
					> 
					<button
					class="btn bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded-r-sm" 
					>
						Export to Pdf
					</button>
					</JsonExcel>
				</div>	
				<div class="rounded text-center p-4 bg-blue-600">
					<button id="create-new-btn" type="button" 
					@click="showCreateModal = true"
						class="font-medium text-white hover:underline">Create New Staff</button>
				</div>
			</div>

			<div class="h-[70vh] overflow-y-scroll text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
				<table id="element-to-print" class="w-full">
					<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
						<tr>
							<th scope="col" class="px-6 py-3">
								ID
							</th>
							<th scope="col" class="px-6 py-3">
								Staff ID
							</th>
							<th scope="col" class="px-6 py-3">
								Fullname
							</th>
							<th scope="col" class="px-6 py-3">
								Gender
							</th>
							<th scope="col" class="px-6 py-3">
								Birthdate
							</th>
							<th scope="col" class="px-6 py-3">
								Action
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(s, rowIndex) in staffsData" :key="rowIndex"
							class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
							<td class="px-6 py-4">
								{{ s.id }}
							</td>
							<td class="px-6 py-4">
								{{  s.staffId }}
							</td>
							<td class="px-6 py-4">
								{{  s.fullname }}
							</td>
							<td class="px-6 py-4">
								{{  s.gender == 1 ? "Male" : "Female"  }} 
							</td>
							<td class="px-6 py-4">
								{{ moment(new Date(s.birthdate)).format("MMM Do YYYY") }}
							</td>
							<td class="px-6 space-x-2 py-4">
								<!-- Modal toggle -->
								<button @click="updateSelectedRow(rowIndex); showEditModal = true" 
									type="button"
									class="btn font-medium text-white hover:underline inline-block rounded p-2 bg-blue-600">
									Edit
								</button>
									
								<button @click="updateSelectedRow(rowIndex); showDeleteModal = true" 
									type="button"
									class="btn font-medium text-white hover:underline inline-block rounded p-2 bg-red-800">
									Delete
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<div id="editUserModal1" tabindex="-1" 
			class="hidden fixed top-0 left-0 right-0 w-100 h-100 flex z-50 items-center justify-center w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full"
			>
			<div class="relative w-full max-w-2xl max-h-full">
				<div  class="relative bg-white rounded-lg shadow dark:bg-gray-700">
					<h1 class="p-10 text-xl font-semibold text-gray-900 dark:text-white">
						Edit
					</h1>	
					<!-- <button @click="showEditModal = false ">Close</button> -->
				</div>
			</div>
		</div>	

		<!-- Edit user modal -->
		<div id="editUserModal" tabindex="-1" aria-hidden="true"
		    v-if="showEditModal"
			class="flex fixed top-0 left-0 right-0 z-50 items-center justify-center w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
			<div class="relative w-full max-w-2xl max-h-full">
				<!-- Modal content -->
				<form @submit.prevent="updateStaff" class="relative bg-white rounded-lg shadow dark:bg-gray-700">
					<!-- Modal header -->
					<div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
						<h3 class="text-xl font-semibold text-gray-900 dark:text-white">
							Edit
						</h3>
						<button type="button"
						@click="showEditModal = false"
							class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
							data-modal-hide="editUserModal">
							<svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
								viewBox="0 0 14 14">
								<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
							</svg>
							<span class="sr-only">Close modal</span>
						</button>
					</div>
					<!-- Modal body -->
					<div class="p-6 space-y-6">
						<div class="col-span-6 sm:col-span-3">
							<label for="user-id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">ID</label>
							<input type="text" name="user-id" id="user-id" v-model="selectedStaff.id" readonly
								class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
								placeholder="Staff ID" required="true">
						</div>

						<div class="col-span-6 sm:col-span-3">
							<label for="staff-id-update" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Staff
								ID</label>
							<input type="text" name="staff-id" id="staff-id-update" v-model="selectedStaff.staffId"
								class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
								placeholder="Staff ID" required="true">
						</div>
						<div class="col-span-6 sm:col-span-3">
							<label for="fullname"
								class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fullname</label>
							<input type="text" name="fullname" id="fullname-update" v-model="selectedStaff.fullname"
								class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
								placeholder="Fullname" required="true">
						</div>
						<div class="col-span-6 sm:col-span-3">
							<label for="gender"
								class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Gender</label>
							<select required id="gender-update" v-model="selectedStaff.gender"
								class="w-[20%] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
								<option selected value=1>Male</option>
								<option value=2>Female</option>
							</select>
						</div>
						<div class="">
							<label for="birthdate"
								class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Birthdate</label>
							<VueDatePicker 
								@keydown.enter.prevent
								text-input
								required
								id="birthdate-update"
								:enable-time-picker="false"
								class="shadow-sm md:w-[30%] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
								v-model="selectedStaff.birthdate" />
						</div>
					</div>
					<!-- Modal footer -->
					<div
						class="flex items-center p-6 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
						<button type="submit"
							class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save
							all</button>
						<button type="button"
						@click="showEditModal = false"
							class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
							Cancel</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Delete user modal -->
		<div id="deleteUserModal" tabindex="-1"
		v-if="showDeleteModal"
			data-modal-backdrop="static"
			class="flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
			<div class="relative p-4 w-full max-w-md max-h-full">
				<div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
					<button type="button"
					@click="showDeleteModal = false"
						class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
						data-modal-hide="deleteUserModal">
						<svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
							viewBox="0 0 14 14">
							<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
						</svg>
						<span class="sr-only">Close modal</span>
					</button>
				<div class="p-4 md:p-5 text-center">
					<svg class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
						<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
					<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete
						this Staff?</h3>
					<button @click="deleteStaff" data-modal-hide="deleteUserModal" type="submit"
						class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center">
						Yes, I'm sure
					</button>
					<button data-modal-hide="deleteUserModal" type="button"
					@click="showDeleteModal = false"
						class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">No,
						cancel</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Create user modal -->
	<div id="createUserModal" tabindex="-1"
	    v-if="showCreateModal"
		class="flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
		<div class="relative w-full max-w-2xl max-h-full">
			<!-- Modal content -->
			<form @submit.prevent="createStaff" class="relative bg-white rounded-lg shadow dark:bg-gray-700">
				<!-- Modal header -->
				<div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
					<h3 class="text-xl font-semibold text-gray-900 dark:text-white">
						Create new staff 
					</h3>
					<button type="button"
					    @click="showCreateModal = false"
						class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
						data-modal-hide="createUserModal">
						<svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
							viewBox="0 0 14 14">
							<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
						</svg>
						<span class="sr-only">Close modal</span>
					</button>
				</div>
						<!-- Modal body -->
						<div class="p-6 space-y-6">
							<div class="col-span-6 sm:col-span-3">
								<label for="staff-id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Staff
									ID</label>
								<input type="text" name="staff-id" id="staff-id-create" v-model="newStaff.staffId"
									class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
									placeholder="Staff ID" required="true">
							</div>
							<div class="col-span-6 sm:col-span-3">
								<label for="fullname"
									class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fullname</label>
								<input type="text" name="fullname" id="fullname-create" v-model="newStaff.fullname"
									class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
									placeholder="Fullname" required="true">
							</div>
							<div class="col-span-6 sm:col-span-3">
								<label for="gender"
									class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Gender</label>
								<select required id="gender-create" v-model="newStaff.gender"
									class="w-[20%] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
									<option selected value=1>Male</option>
									<option value=2>Female</option>
								</select>
							</div>
							<div class="">
								<label for="birthdate"
									class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Birthdate</label>
								<VueDatePicker 
								@keydown.enter.prevent
									text-input
									required
									id="birthdate-create"
									:enable-time-picker="false"
									class="shadow-sm md:w-[30%] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
									v-model="newStaff.birthdate" />
							</div>
						</div>
						<!-- Modal footer -->
						<div
							class="flex items-center p-6 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
							<button type="submit"
								class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save
							</button>
							<button 
								type="button"
								@click="showCreateModal = false"
								class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Cancel
							</button>
						</div>
			</form>
		</div>
		</div>
	</div>

	<!-- Fix initialization of flowbite modal -->
	<div data-modal-target="deleteUserModal" ></div>
	<div data-modal-target="editUserModal" ></div>
</template>