import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ModelsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Models</CardTitle>
        <CardDescription>
          Manage API keys and system instructions for your models.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">OpenAI</h3>
          <div className="space-y-2">
            <Label htmlFor="openai-key">API Key</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="Enter your OpenAI API key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai-instructions">System Instructions</Label>
            <Textarea
              id="openai-instructions"
              placeholder="You are a helpful assistant."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Google Gemini</h3>
          <div className="space-y-2">
            <Label htmlFor="gemini-key">API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="Enter your Google Gemini API key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gemini-instructions">System Instructions</Label>
            <Textarea
              id="gemini-instructions"
              placeholder="You are a helpful assistant."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Anthropic Claude</h3>
          <div className="space-y-2">
            <Label htmlFor="claude-key">API Key</Label>
            <Input
              id="claude-key"
              type="password"
              placeholder="Enter your Anthropic Claude API key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="claude-instructions">System Instructions</Label>
            <Textarea
              id="claude-instructions"
              placeholder="You are a helpful assistant."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button>Save Settings</Button>
      </CardFooter>
    </Card>
  );
}
