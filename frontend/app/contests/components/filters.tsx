import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ContestFilters } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

const Filters = ({
    onFilterChange,
}: {
    onFilterChange: (filters: ContestFilters) => void;
}) => {
    const { t } = useTranslation();
    const [filters, setFilters] = useState<ContestFilters>({
        language: "",
        startDate: "",
        endDate: "",
        prize: "",
    });

    const handleChange = (key: keyof ContestFilters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="flex flex-col gap-6 md:w-1/4">
            <div className="grid gap-2">
                <label htmlFor="language" className="text-sm font-medium">
                    {t('contestsPage.filters.language')}
                </label>
                <Select
                    value={filters.language ?? ""}
                    onValueChange={(value) => handleChange("language", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="javascript">javascript</SelectItem>
                        <SelectItem value="python">python</SelectItem>
                        <SelectItem value="c#">c#</SelectItem>
                        <SelectItem value="java">java</SelectItem>
                        <SelectItem value="go">go</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <label htmlFor="start-date" className="text-sm font-medium">
                    {t('contestsPage.filters.startDate')}
                </label>
                <Input
                    type="date"
                    id="start-date"
                    value={filters.startDate ?? ""}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                />
            </div>
            <div className="grid gap-2">
                <label htmlFor="end-date" className="text-sm font-medium">
                    {t('contestsPage.filters.endDate')}
                </label>
                <Input
                    type="date"
                    id="end-date"
                    value={filters.endDate ?? ""}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                />
            </div>
            <div className="grid gap-2">
                <label htmlFor="prize-amount" className="text-sm font-medium">
                    {t('contestsPage.filters.prize')}
                </label>
                <Input
                    type="number"
                    id="prize-amount"
                    value={filters.prize ?? ""}
                    onChange={(e) => handleChange("prize", e.target.value)}
                    placeholder="$0"
                />
            </div>
        </div>
    );
};

export default Filters;
