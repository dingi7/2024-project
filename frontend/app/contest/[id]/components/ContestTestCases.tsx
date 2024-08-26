import React, { useState, ChangeEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus } from "lucide-react";
import { TestCase } from "@/lib/types";
import { addTestCase, deleteTestCase } from "@/app/api/requests";

interface ContestTestCasesProps {
  contestId: string;
  dbTestCases: any[];
}

const ContestTestCases: React.FC<ContestTestCasesProps> = ({
  contestId,
  dbTestCases,
}) => {
  const [testCases, setTestCases] = useState<TestCase[] | []>(
    dbTestCases || []
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTestCase, setNewTestCase] = useState<TestCase>({
    id: 0,
    input: "",
    output: "",
    timeLimit: "",
  });

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = (id: number) => {
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    deleteTestCase(contestId, id.toString());
    setTestCases(testCases.filter((testCase) => testCase.id !== id));
  };

  const handleInputChange = (
    id: number,
    field: keyof TestCase,
    value: string
  ) => {
    setTestCases(
      testCases.map((testCase) =>
        testCase.id === id ? { ...testCase, [field]: value } : testCase
      )
    );
  };

  const handleNewTestCaseChange = (field: keyof TestCase, value: string) => {
    setNewTestCase({ ...newTestCase, [field]: value });
  };

  const handleAddTestCase = async () => {
    const response = await addTestCase(contestId, {
      input: newTestCase.input,
      output: newTestCase.output,
    });
    setTestCases([...testCases, response]);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test Cases</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Input</TableHead>
            <TableHead>Output</TableHead>
            <TableHead>Time Limit (ms)</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testCases?.map((testCase) => (
            <TableRow key={testCase.id}>
              <TableCell>
                {editingId === testCase.id ? (
                  <Input
                    value={testCase.input}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(testCase.id, "input", e.target.value)
                    }
                  />
                ) : (
                  testCase.input
                )}
              </TableCell>
              <TableCell>
                {editingId === testCase.id ? (
                  <Input
                    value={testCase.output}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(testCase.id, "output", e.target.value)
                    }
                  />
                ) : (
                  testCase.output
                )}
              </TableCell>
              <TableCell>
                {editingId === testCase.id ? (
                  <Input
                    value={testCase.timeLimit}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(
                        testCase.id,
                        "timeLimit",
                        e.target.value
                      )
                    }
                  />
                ) : (
                  testCase.timeLimit
                )}
              </TableCell>
              <TableCell>
                <div className="flex-col flex justify-center items-center gap-2">
                  {editingId === testCase.id ? (
                    <Button onClick={() => handleSave(testCase.id)}>
                      Save
                    </Button>
                  ) : (
                    <Button onClick={() => handleEdit(testCase.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button onClick={() => handleDelete(testCase.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>
              <Input
                placeholder="New input"
                value={newTestCase.input}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleNewTestCaseChange("input", e.target.value)
                }
              />
            </TableCell>
            <TableCell>
              <Input
                placeholder="New output"
                value={newTestCase.output}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleNewTestCaseChange("output", e.target.value)
                }
              />
            </TableCell>
            <TableCell>
              <Input
                placeholder="Time limit"
                value={newTestCase.timeLimit}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleNewTestCaseChange("timeLimit", e.target.value)
                }
              />
            </TableCell>
            <TableCell>
              <Button onClick={handleAddTestCase}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default ContestTestCases;
