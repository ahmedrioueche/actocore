import { PageHeader } from "@/components/layout/PageHeader";
import CustomSelect from "@/components/ui/CustomSelect";
import Error from "@/components/ui/Error";
import InputField from "@/components/ui/InputField";
import { useAdminListState } from "@/hooks/use-admin-list-state";
import { usePlatformReports } from "@/hooks/use-platform-data";
import {
  StudioReportStatus,
  StudioReportType,
} from "@ahmedrioueche/actocore-shared";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AdminReportsTable } from "./ReportsTable";

const STATUS_FILTER_OPTIONS = [
  "",
  StudioReportStatus.OPEN,
  StudioReportStatus.RESOLVED,
] as const;
const TYPE_FILTER_OPTIONS = [
  "",
  StudioReportType.ISSUE,
  StudioReportType.FEEDBACK,
] as const;

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const { page, setPage, searchInput, setSearchInput, search, applySearch } =
    useAdminListState();
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const reportsQuery = usePlatformReports(
    search,
    statusFilter,
    typeFilter,
    page,
  );
  const reports = reportsQuery.data?.items ?? [];

  const statusOptions = STATUS_FILTER_OPTIONS.map((value) => ({
    value,
    label: value
      ? t(`reports.status.${value}`)
      : t("admin.reports.filters.allStatuses"),
  }));

  const typeOptions = TYPE_FILTER_OPTIONS.map((value) => ({
    value,
    label: value
      ? t(`reports.types.${value}`)
      : t("admin.reports.filters.allTypes"),
  }));

  return (
    <>
      <PageHeader
        title={t("admin.reports.title")}
        subtitle={t("admin.reports.subtitle")}
      />

      <form
        className="mb-4 grid gap-4 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch();
        }}
      >
        <InputField
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("admin.reports.searchPlaceholder")}
        />
        <CustomSelect
          options={statusOptions}
          selectedOption={statusFilter}
          onChange={setStatusFilter}
        />
        <CustomSelect
          options={typeOptions}
          selectedOption={typeFilter}
          onChange={setTypeFilter}
        />
      </form>

      {reportsQuery.isError ? (
        <Error onRetry={() => void reportsQuery.refetch()} />
      ) : (
        <AdminReportsTable
          reports={reports}
          isLoading={reportsQuery.isLoading}
          meta={reportsQuery.data}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
