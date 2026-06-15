import { getCookie } from "cookies-next";
import Link from "next/link";
import React from "react";
import { useQuery } from "react-query";
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useTable,
} from "react-table";
import ResetPassword from "../../../../components//ResetPassword";
import UpdateUserModal from "../../../../components/UpdateUserModal";

const fetchUsers = async (token) => {
  const res = await fetch(`/api/v1/users/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

function DefaultColumnFilter({ column: { filterValue, setFilter } }) {
  return (
    // <input
    //   className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
    //   type="text"
    //   value={filterValue || ""}
    //   autoComplete="off"
    //   onChange={(e) => {
    //     setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
    //   }}
    //   placeholder="Type to filter"
    // />
    <></>
  );
}
function Table({ columns, data }) {
  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      // fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) =>
        rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        }),
    }),
    [],
  );

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    [],
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      defaultColumn, // Be sure to pass the defaultColumn option
      filterTypes,
      initialState: {
        pageIndex: 0,
      },
    },
    useFilters, // useFilters!
    useGlobalFilter,
    usePagination,
  );

  return (
    <div className="overflow-x-auto md:-mx-6 lg:-mx-8">
      <div className="py-2 align-middle inline-block min-w-full md:px-6 lg:px-8">
        <div className="overflow-hidden border-b border-gray-200 shadow dark:border-gray-800 md:rounded-lg">
          <table
            {...getTableProps()}
            className="min-w-full divide-y divide-gray-200 dark:divide-gray-800"
          >
            <thead className="bg-gray-50 dark:bg-gray-900">
              {headerGroups.map((headerGroup) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  key={headerGroup.headers.map((header) => header.id)}
                >
                  {headerGroup.headers.map((column) =>
                    column.hideHeader === false ? null : (
                      <th
                        {...column.getHeaderProps()}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                      >
                        {column.render("Header")}
                        {/* Render the columns filter UI */}
                        <div>
                          {column.canFilter ? column.render("Filter") : null}
                        </div>
                      </th>
                    ),
                  )}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row, i) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    className="bg-white dark:bg-gray-950"
                  >
                    {row.cells.map((cell) => (
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                        {...cell.getCellProps()}
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data.legnth > 10 && (
            <nav
              className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 sm:px-6"
              aria-label="Pagination"
            >
              <div className="hidden sm:block">
                <div className="flex flex-row flex-nowrap w-full space-x-2">
                  <p
                    htmlFor="location"
                    className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Show
                  </p>
                  <select
                    id="location"
                    name="location"
                    className="block w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 text-base text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white sm:text-sm"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                    }}
                  >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <button
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
                  type="button"
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                >
                  Previous
                </button>
                <button
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
                  type="button"
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserAuthPanel() {
  const token = getCookie("session");
  const { data, status, refetch } = useQuery("fetchAuthUsers", () =>
    fetchUsers(token),
  );

  async function deleteUser(id) {
    try {
      await fetch(`/api/v1/auth/user/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then(() => {
          refetch();
        });
    } catch (error) {
      console.log(error);
    }
  }

  const columns = React.useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        width: 10,
        id: "name",
      },
      {
        Header: "Email",
        accessor: "email",
        id: "email",
      },
      {
        Header: "",
        id: "actions",
        Cell: ({ row }) => {
          return (
            <div className="space-x-4 flex flex-row">
              <UpdateUserModal user={row.original} />
              <ResetPassword user={row.original} />
              {row.original.isAdmin ? null : (
                <button
                  type="button"
                  onClick={() => deleteUser(row.original.id)}
                  className="inline-flex items-center px-4 py-1.5 border font-semibold border-gray-300 shadow-sm text-xs rounded text-white bg-red-700 hover:bg-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16 divide-y-2">
          <div className="px-4 sm:px-6 md:px-0">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Internal Users
            </h1>
          </div>
          <div className="px-4 sm:px-6 md:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto mt-4">
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  A list of all internal users of your instance.
                </p>
              </div>
              <div className="sm:ml-16 mt-5 sm:flex-none">
                <Link
                  href="/admin/users/internal/new"
                  className="rounded bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-950 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-900"
                >
                  New User
                </Link>
              </div>
            </div>
            <div className="py-4">
              {status === "loading" && (
                <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                  <h2> Loading data ... </h2>
                </div>
              )}

              {status === "error" && (
                <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold">
                    {" "}
                    Error fetching data ...{" "}
                  </h2>
                </div>
              )}

              {status === "success" && (
                <div>
                  <div className="hidden sm:block">
                    <Table columns={columns} data={data.users} />
                  </div>
                  <div className="sm:hidden">
                    {data.users.map((user) => (
                      <div
                        key={user.id}
                        className="mt-4 flex flex-col rounded-lg bg-white text-center shadow dark:bg-gray-950"
                      >
                        <div className="flex-1 flex flex-col p-8">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          <dl className="mt-1 flex-grow flex flex-col justify-between">
                            <dd className="text-sm text-gray-500 dark:text-gray-300">
                              {user.email}
                            </dd>
                            <dt className="sr-only">Role</dt>
                            <dd className="mt-3">
                              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-950/40 dark:text-green-200">
                                {user.isAdmin ? "admin" : "user"}
                              </span>
                            </dd>
                          </dl>
                        </div>
                        <div className="space-x-4 flex flex-row justify-center -mt-8 mb-4">
                          <UpdateUserModal
                            user={user}
                            refetch={() => handleRefresh}
                          />
                          <ResetPassword user={user} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
